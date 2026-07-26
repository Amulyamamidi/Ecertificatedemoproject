const emailjs = require("@emailjs/nodejs");
require("dotenv").config();

/**
 * Sends a verification OTP email using EmailJS service exclusively
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-Digit OTP code
 * @param {string} userName - Name of the user (student or institution)
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
async function sendOtpEmail(toEmail, otp, userName) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("==================================================");
    console.warn("⚠️ [EMAILJS SERVICE] EMAILJS credentials (SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY) not configured in backend/.env!");
    console.warn(`📩 [CONSOLE FALLBACK LOG] Verification OTP for ${toEmail} is: ${otp}`);
    console.warn("==================================================");
    return false;
  }

  const templateParams = {
    to_email: toEmail,
    to_name: userName || "User",
    user_name: userName || "User",
    otp_code: otp,
    otp: otp,
    subject: "Verify your Email - CertiShield JNTUGV"
  };

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      {
        publicKey: publicKey,
        privateKey: privateKey
      }
    );

    console.log(`📧 [EMAILJS SERVICE] Verification OTP email successfully sent to ${toEmail} (Status: ${response.status}, Text: ${response.text})`);
    return true;
  } catch (error) {
    console.error(`❌ [EMAILJS SERVICE] Failed to send OTP email to ${toEmail}:`, error.text || error.message || error);
    console.warn("==================================================");
    console.warn(`📩 [CONSOLE FALLBACK LOG] Verification OTP for ${toEmail} is: ${otp}`);
    console.warn("==================================================");
    return false;
  }
}

module.exports = {
  sendOtpEmail
};
