// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {

    struct Certificate {
        bytes32 certHash;
        string ipfsCID;
        address issuer;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(address => bool) public isAuthorizedIssuer;
    address public admin;

    event CertificateIssued(bytes32 indexed certId, address indexed issuer, bytes32 certHash, string ipfsCID);
    event CertificateRevoked(bytes32 indexed certId, address indexed issuer);
    event IssuerAuthorized(address indexed issuer);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(isAuthorizedIssuer[msg.sender], "Not an authorized institution");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function authorizeIssuer(address institution) external onlyAdmin {
        isAuthorizedIssuer[institution] = true;
        emit IssuerAuthorized(institution);
    }

    function deauthorizeIssuer(address institution) external onlyAdmin {
        isAuthorizedIssuer[institution] = false;
    }

    function issueCertificate(bytes32 certId, bytes32 certHash, string calldata ipfsCID)
        external
        onlyAuthorizedIssuer
    {
        require(certificates[certId].issuedAt == 0, "Certificate already exists");
        certificates[certId] = Certificate(certHash, ipfsCID, msg.sender, block.timestamp, false);
        emit CertificateIssued(certId, msg.sender, certHash, ipfsCID);
    }

    function revokeCertificate(bytes32 certId) external {
        require(certificates[certId].issuer == msg.sender, "Only original issuer can revoke");
        certificates[certId].revoked = true;
        emit CertificateRevoked(certId, msg.sender);
    }

    function verifyCertificate(bytes32 certId, bytes32 providedHash)
        external
        view
        returns (bool isValid, bool isRevoked, address issuer, uint256 issuedAt, string memory ipfsCID)
    {
        Certificate memory c = certificates[certId];
        isValid = (c.issuedAt != 0 && c.certHash == providedHash);
        isRevoked = c.revoked;
        issuer = c.issuer;
        issuedAt = c.issuedAt;
        ipfsCID = c.ipfsCID;
    }

    function getCertificate(bytes32 certId)
        external
        view
        returns (bytes32 certHash, string memory ipfsCID, address issuer, uint256 issuedAt, bool revoked)
    {
        Certificate memory c = certificates[certId];
        return (c.certHash, c.ipfsCID, c.issuer, c.issuedAt, c.revoked);
    }
}
