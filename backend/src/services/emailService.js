const { Resend } = require("resend");
require("dotenv").config();

/**
 * Sends a production-grade HTML email containing the verification OTP using Resend REST API.
 * 
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-Digit OTP code
 * @param {string} userName - Name of the recipient user/institution
 * @returns {Promise<boolean>} True if dispatched successfully, false otherwise
 */
async function sendOtpEmail(toEmail, otp, userName) {
  const normalizedEmail = (toEmail || "").trim().toLowerCase();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - CertiShield JNTUGV</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f1f5f9;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          background-color: #f1f5f9;
          padding: 30px 15px;
        }
        .container {
          max-width: 580px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #0d2358 0%, #1e3a8a 100%);
          padding: 36px 30px;
          text-align: center;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 9999px;
          color: #60a5fa;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .logo {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          margin: 0;
        }
        .content {
          padding: 36px 32px;
          color: #334155;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          margin-top: 0;
          color: #0f172a;
        }
        .message {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 24px;
        }
        .otp-box {
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 24px;
          text-align: center;
          margin: 28px 0;
        }
        .otp-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 800;
          color: #0d2358;
          letter-spacing: 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .security-note {
          font-size: 13px;
          line-height: 1.5;
          color: #64748b;
          background-color: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          margin-top: 24px;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }
        .footer-title {
          font-weight: 700;
          color: #0d2358;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <div class="badge">Official Verification</div>
            <h1 class="logo">CERTISHIELD JNTUGV</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${userName || "User"},</p>
            <p class="message">
              Thank you for registering on the JNTUGV Blockchain Certificate Verification Portal. To complete your email verification and activate your portal access, please use the 6-digit code below:
            </p>
            <div class="otp-box">
              <div class="otp-label">One-Time Verification Code</div>
              <div class="otp-code">${otp}</div>
            </div>
            <div class="security-note">
              <strong>Security Notice:</strong> This code is confidential. JNTUGV system administrators will never ask for your code. If you did not initiate this request, please disregard this email.
            </div>
          </div>
          <div class="footer">
            <div class="footer-title">Jawaharlal Nehru Technological University Gurajada Vizianagaram</div>
            <div>Established by Andhra Pradesh Act No. 22 of 2021 | Decentralized Blockchain Academic Registry</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.warn("==================================================");
    console.warn("⚠️ [RESEND SERVICE] RESEND_API_KEY is not defined in backend/.env!");
    console.warn(`📩 [CONSOLE FALLBACK] OTP for ${normalizedEmail} is: ${otp}`);
    console.warn("==================================================");
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "CertiShield <onboarding@resend.dev>";
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [normalizedEmail],
      subject: `Verify your Email - CertiShield JNTUGV`,
      html: htmlContent
    });

    if (error) {
      console.error("❌ [RESEND API] Delivery Notice:", error.message || JSON.stringify(error));
      console.warn(`📩 [CONSOLE FALLBACK] OTP for ${normalizedEmail} is: ${otp}`);
      return false;
    }

    console.log(`🚀 [RESEND API] Production OTP email dispatched to ${normalizedEmail} (ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error("❌ [RESEND API] Exception while sending email:", err.message);
    console.warn(`📩 [CONSOLE FALLBACK] OTP for ${normalizedEmail} is: ${otp}`);
    return false;
  }
}

module.exports = {
  sendOtpEmail
};
