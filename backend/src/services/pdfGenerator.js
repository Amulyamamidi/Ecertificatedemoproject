const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");

/**
 * Generates an elegant PDF certificate in memory with embedded QR Code.
 * Returns a Promise that resolves to a Buffer.
 * @param {object} details - { studentName, registrationNumber, courseName, grade, issueDate, institutionName, certId, certHash, studentPhoto, issuerWallet, baseUrl }
 * @returns {Promise<Buffer>} PDF file buffer
 */
async function generateCertificatePDF(details) {
  // Compute fallback document hash if not passed explicitly
  const certHash = details.certHash || ("0x" + crypto.createHash("sha256").update(`${details.certId}-${details.studentName}-${details.registrationNumber}-${details.courseName}`).digest("hex"));

  // Generate QR Code Buffer for verification link
  let qrBuffer = null;
  try {
    const activeBaseUrl = (details.baseUrl || process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
    const verifyUrl = `${activeBaseUrl}/verify-by-id?id=${details.certId}`;
    qrBuffer = await QRCode.toBuffer(verifyUrl, {
      margin: 1,
      width: 150,
      color: {
        dark: "#1e3a8a",
        light: "#ffffff"
      }
    });
  } catch (qrErr) {
    console.error("[PDF Generator] QR code generation error:", qrErr);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 30, left: 30, bottom: 30, right: 30 },
      compress: true,
      info: {
        Title: "E-Certificate of Completion",
        Author: details.institutionName || "JNTUGV",
        Subject: details.certId,
        Keywords: `certid:${details.certId}`
      }
    });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Page Dimensions (A4 landscape is 841.89 x 595.28)
    const width = 841.89;
    const height = 595.28;

    // 1. Draw Elegant Double Border
    doc.lineWidth(4)
       .rect(25, 25, width - 50, height - 50)
       .stroke("#1e3a8a"); // Deep navy blue

    doc.lineWidth(1)
       .rect(31, 31, width - 62, height - 62)
       .stroke("#b45309"); // Amber border

    // Decorative corner shapes
    doc.save()
       .rect(25, 25, 18, 18).fill("#1e3a8a")
       .rect(width - 43, 25, 18, 18).fill("#1e3a8a")
       .rect(25, height - 43, 18, 18).fill("#1e3a8a")
       .rect(width - 43, height - 43, 18, 18).fill("#1e3a8a")
       .restore();

    // 2. University Logo (Positioned on the Left Side, slightly downside)
    const logoPngPath = path.join(__dirname, "../../storage/jntugv_logo.png");
    const logoJpgPath = path.join(__dirname, "../../storage/jntugv_logo.jpg");
    const jntugvLogoPath = fs.existsSync(logoPngPath) ? logoPngPath : logoJpgPath;

    if (fs.existsSync(jntugvLogoPath)) {
      try {
        const logoWidth = 54;
        const logoHeight = 54;
        const logoX = 52;
        const logoY = 48;
        doc.image(jntugvLogoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
      } catch (logoError) {
        console.error("[PDF Generator] Failed to embed university logo in PDF:", logoError);
      }
    }

    // Helper function to capitalize names nicely
    const capitalizeName = (str) => {
      if (!str) return "";
      return str
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // 2.5 Rearranged Student Photo (Top Right Frame with Label)
    if (details.studentPhoto && fs.existsSync(details.studentPhoto)) {
      try {
        const photoX = width - 120;
        const photoY = 42;
        const photoW = 72;
        const photoH = 88;

        // Double Frame around Student Photograph
        doc.lineWidth(1.5)
           .rect(photoX - 2, photoY - 2, photoW + 4, photoH + 4)
           .strokeColor("#1e3a8a")
           .stroke();

        doc.lineWidth(0.5)
           .rect(photoX, photoY, photoW, photoH)
           .strokeColor("#b45309")
           .stroke();
        
        doc.image(details.studentPhoto, photoX + 1, photoY + 1, { width: photoW - 2, height: photoH - 2 });

        doc.font("Helvetica-Bold")
           .fontSize(6)
           .fillColor("#4b5563")
           .text("PHOTOGRAPH", photoX - 5, photoY + photoH + 4, { width: photoW + 10, align: "center" });
      } catch (imageError) {
        console.error("[PDF Generator] Failed to embed student photo in PDF:", imageError);
      }
    }

    // Header Titles (centered between left logo and right photograph)
    const jntuTitle = "JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY GURAJADA VIZIANAGARAM";
    const jntuSubtitle = "(Established by Andhra Pradesh Act No.22 of 2021)";

    const headerX = 115;
    const headerW = width - 230; // 611.89pt width available

    // Main University Title - Guaranteed single line at 13.5pt with lineBreak: false
    doc.fillColor("#1e3a8a")
       .fontSize(13.5)
       .font("Helvetica-Bold")
       .text(jntuTitle, headerX, 48, { width: headerW, align: "center", lineBreak: false });

    // Subtitle
    doc.fillColor("#b45309")
       .fontSize(8.5)
       .font("Helvetica-Oblique")
       .text(jntuSubtitle, headerX, 68, { width: headerW, align: "center" });

    // Official Academic Credential
    doc.fillColor("#6b7280")
       .fontSize(7.5)
       .font("Helvetica")
       .text("OFFICIAL ACADEMIC CREDENTIAL", headerX, 82, { width: headerW, align: "center", characterSpacing: 2 });

    // Prominent E-CERTIFICATE Banner Title
    doc.fillColor("#b45309")
       .fontSize(18)
       .font("Helvetica-Bold")
       .text("E - CERTIFICATE", headerX, 98, { width: headerW, align: "center", characterSpacing: 3 });

    // Decorative divider line
    doc.lineWidth(1.5)
       .moveTo(width / 2 - 160, 124)
       .lineTo(width / 2 + 160, 124)
       .stroke("#b45309");

    // 3. Certificate Body Content
    let currentY = 138;

    doc.fillColor("#374151")
       .fontSize(13)
       .font("Helvetica-Oblique")
       .text("This is to certify that", 50, currentY, { width: width - 100, align: "center" });

    currentY += 20;
    const formattedStudentName = capitalizeName(details.studentName);
    const nameFontSize = formattedStudentName.length > 28 ? 26 : 30;
    doc.fillColor("#111827")
       .fontSize(nameFontSize)
       .font("Helvetica-Bold")
       .text(formattedStudentName, 50, currentY, { width: width - 100, align: "center" });

    currentY += nameFontSize + 8;
    doc.fillColor("#4b5563")
       .fontSize(12)
       .font("Helvetica")
       .text(`Registration Number: ${details.registrationNumber || "N/A"}`, 50, currentY, { width: width - 100, align: "center" });

    currentY += 20;
    doc.fillColor("#374151")
       .fontSize(13)
       .font("Helvetica-Oblique")
       .text("has successfully completed the program in", 50, currentY, { width: width - 100, align: "center" });

    currentY += 20;
    doc.fillColor("#1e3a8a")
       .fontSize(18)
       .font("Helvetica-Bold")
       .text(details.courseName || "", 50, currentY, { width: width - 100, align: "center" });

    currentY += 24;
    doc.fillColor("#374151")
       .fontSize(13)
       .font("Helvetica-Oblique")
       .text("conducted at", 50, currentY, { width: width - 100, align: "center" });

    // College Name and Affiliation check
    const rawClgName = details.institutionName || "JNTUGV";
    const cleanCollegeName = rawClgName.replace(/\/n/g, " ").replace(/\\n/g, " ").trim();

    const lowerName = cleanCollegeName.toLowerCase();
    const isMainUniversity = lowerName.includes("jntugv university college") || lowerName === "jntugv" || lowerName.includes("jawaharlal nehru technological university gurajada");

    currentY += 18;
    if (!isMainUniversity) {
      // Display Associate / Affiliated College Name prominently
      doc.fillColor("#111827")
         .fontSize(15)
         .font("Helvetica-Bold")
         .text(cleanCollegeName, 50, currentY, { width: width - 100, align: "center" });

      currentY += 18;
      doc.fillColor("#4b5563")
         .fontSize(9.5)
         .font("Helvetica-Oblique")
         .text("(Affiliated to Jawaharlal Nehru Technological University Gurajada Vizianagaram)", 50, currentY, { width: width - 100, align: "center" });
    } else {
      // Main University Campus
      doc.fillColor("#111827")
         .fontSize(15)
         .font("Helvetica-Bold")
         .text("JNTUGV UNIVERSITY CAMPUS, VIZIANAGARAM", 50, currentY, { width: width - 100, align: "center" });
    }

    // Grade Text
    currentY += 22;
    const formattedGrade = details.grade ? String(details.grade).trim() : "A+";
    doc.fillColor("#374151")
       .fontSize(13)
       .font("Helvetica")
       .text(`with the grade of  ${formattedGrade}`, 50, currentY, { width: width - 100, align: "center" });

    // 4. Footer Section (Date & Authorized Signature)
    const footerY = height - 128;

    doc.font("Helvetica")
       .fontSize(10.5)
       .fillColor("#4b5563")
       .text(`Date of Issue: ${details.issueDate || ""}`, 55, footerY);
       
    // Right: Authorized Signature line
    doc.lineWidth(1)
       .moveTo(width - 270, footerY - 5)
       .lineTo(width - 140, footerY - 5)
       .stroke("#9ca3af");
    doc.text("Registrar / Director", width - 270, footerY, { width: 130, align: "center" });

    // 5. Embed QR Code (Bottom Right)
    if (qrBuffer) {
      try {
        const qrSize = 52;
        const qrX = width - 118;
        const qrY = height - 94;

        doc.lineWidth(1)
           .rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6)
           .strokeColor("#1e3a8a")
           .stroke();

        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

        doc.font("Helvetica-Bold")
           .fontSize(6)
           .fillColor("#1e3a8a")
           .text("SCAN TO VERIFY", qrX - 10, qrY + qrSize + 4, { width: qrSize + 20, align: "center" });
      } catch (qrDrawErr) {
        console.error("[PDF Generator] Error drawing QR Code in PDF:", qrDrawErr);
      }
    }

    // 6. Secure Blockchain Verification Protocol Footer Block (Includes Hash Value ID)
    let platformName = "Polygon Amoy Testnet";
    if ((process.env.ALCHEMY_AMOY_RPC_URL || "").includes("sepolia")) {
      platformName = "Ethereum Sepolia Testnet";
    }

    doc.save()
       .rect(50, height - 94, width - 175, 54)
       .fillColor("#f8fafc")
       .fill()
       .strokeColor("#cbd5e1")
       .lineWidth(1)
       .stroke();

    doc.font("Helvetica-Bold")
       .fontSize(8)
       .fillColor("#1e3a8a")
       .text("SECURE BLOCKCHAIN VERIFICATION PROTOCOL", 58, height - 88);

    doc.font("Helvetica")
       .fontSize(7)
       .fillColor("#374151")
       .text(`Certificate Verification ID: ${details.certId}`, 58, height - 76);

    doc.text(`Cryptographic SHA-256 Hash: ${certHash}`, 58, height - 66);

    doc.text(`Blockchain Network: ${platformName}  |  Storage: IPFS  |  Issuer: ${details.issuerWallet || "N/A"}`, 58, height - 56);

    doc.restore();

    doc.end();
  });
}

module.exports = {
  generateCertificatePDF
};
