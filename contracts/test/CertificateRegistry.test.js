const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let CertificateRegistry;
  let registry;
  let admin;
  let institution;
  let unauthorizedIssuer;
  let certId;
  let certHash;
  let ipfsCID;

  beforeEach(async function () {
    [admin, institution, unauthorizedIssuer] = await ethers.getSigners();

    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
    await registry.waitForDeployment();

    // Prepare mock data
    // certId is a bytes32 represented as a hash of student details
    certId = ethers.keccak256(ethers.toUtf8Bytes("REG123-STUDENT-NAME-DEGREE"));
    certHash = ethers.keccak256(ethers.toUtf8Bytes("PDF-CONTENT-SHA256-HASH"));
    ipfsCID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("Should not authorize default address as issuer", async function () {
      expect(await registry.isAuthorizedIssuer(institution.address)).to.equal(false);
    });
  });

  describe("Institution Authorization", function () {
    it("Should allow admin to authorize an institution", async function () {
      await expect(registry.connect(admin).authorizeIssuer(institution.address))
        .to.emit(registry, "IssuerAuthorized")
        .withArgs(institution.address);

      expect(await registry.isAuthorizedIssuer(institution.address)).to.equal(true);
    });

    it("Should prevent non-admins from authorizing institutions", async function () {
      await expect(
        registry.connect(unauthorizedIssuer).authorizeIssuer(institution.address)
      ).to.be.revertedWith("Not admin");
    });
  });

  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      await registry.connect(admin).authorizeIssuer(institution.address);
    });

    it("Should allow authorized institution to issue a certificate", async function () {
      await expect(registry.connect(institution).issueCertificate(certId, certHash, ipfsCID))
        .to.emit(registry, "CertificateIssued")
        .withArgs(certId, institution.address, certHash, ipfsCID);

      const cert = await registry.getCertificate(certId);
      expect(cert.certHash).to.equal(certHash);
      expect(cert.ipfsCID).to.equal(ipfsCID);
      expect(cert.issuer).to.equal(institution.address);
      expect(cert.revoked).to.equal(false);
    });

    it("Should prevent unauthorized address from issuing a certificate", async function () {
      await expect(
        registry.connect(unauthorizedIssuer).issueCertificate(certId, certHash, ipfsCID)
      ).to.be.revertedWith("Not an authorized institution");
    });

    it("Should prevent duplicate certificate issuance", async function () {
      await registry.connect(institution).issueCertificate(certId, certHash, ipfsCID);
      await expect(
        registry.connect(institution).issueCertificate(certId, certHash, ipfsCID)
      ).to.be.revertedWith("Certificate already exists");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await registry.connect(admin).authorizeIssuer(institution.address);
      await registry.connect(institution).issueCertificate(certId, certHash, ipfsCID);
    });

    it("Should verify a valid certificate hash", async function () {
      const result = await registry.verifyCertificate(certId, certHash);
      expect(result.isValid).to.equal(true);
      expect(result.isRevoked).to.equal(false);
      expect(result.issuer).to.equal(institution.address);
      expect(result.ipfsCID).to.equal(ipfsCID);
    });

    it("Should fail verification with incorrect hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("DIFFERENT-HASH"));
      const result = await registry.verifyCertificate(certId, wrongHash);
      expect(result.isValid).to.equal(false);
    });

    it("Should fail verification for non-existent certificate", async function () {
      const randomId = ethers.keccak256(ethers.toUtf8Bytes("NON-EXISTENT"));
      const result = await registry.verifyCertificate(randomId, certHash);
      expect(result.isValid).to.equal(false);
      expect(result.issuedAt).to.equal(0);
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await registry.connect(admin).authorizeIssuer(institution.address);
      await registry.connect(institution).issueCertificate(certId, certHash, ipfsCID);
    });

    it("Should allow the original issuer to revoke a certificate", async function () {
      await expect(registry.connect(institution).revokeCertificate(certId))
        .to.emit(registry, "CertificateRevoked")
        .withArgs(certId, institution.address);

      const result = await registry.verifyCertificate(certId, certHash);
      expect(result.isRevoked).to.equal(true);
      expect(result.isValid).to.equal(true); // Still matches hash, but flag is revoked

      const details = await registry.getCertificate(certId);
      expect(details.revoked).to.equal(true);
    });

    it("Should prevent non-issuing institutions or other addresses from revoking a certificate", async function () {
      // Create another authorized institution
      await registry.connect(admin).authorizeIssuer(unauthorizedIssuer.address);

      await expect(
        registry.connect(unauthorizedIssuer).revokeCertificate(certId)
      ).to.be.revertedWith("Only original issuer can revoke");
    });
  });
});
