const nodemailer = require("nodemailer");
const { Resend } = require("resend");
require("dotenv").config();

let cachedTransporter = null;

// Create Pooled SMTP Transporter
const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER || "saikumaredakula@gmail.com";
  const rawPass = process.env.SMTP_PASS || "ofjzhlperzxctkpn";
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    auth: {
      user,
      pass
    }
  });

  return cachedTransporter;
};

/**
 * Sends a premium HTML email containing the verification OTP
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-Digit OTP code
 * @param {string} userName - Name of the user (student or institution)
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
async function sendOtpEmail(toEmail, otp, userName) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #0d2358;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          margin: 0;
        }
        .content {
          padding: 40px 30px;
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
          line-height: 24px;
          color: #475569;
          margin-bottom: 30px;
        }
        .otp-container {
          background-color: #f1f5f9;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 800;
          color: #0d2358;
          letter-spacing: 6px;
          font-family: 'Courier New', Courier, monospace;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
        }
        .footer-logo {
          font-weight: 700;
          color: #0d2358;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">CERTISHIELD JNTUGV</h1>
        </div>
        <div class="content">
          <p class="greeting">Hello ${userName || "User"},</p>
          <p class="message">
            Thank you for registering on the JNTUGV Blockchain Certificate Verification portal. To complete your email verification and activate your account, please enter the 6-digit verification code below:
          </p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="message" style="font-size: 13px; color: #64748b;">
            This verification code will expire shortly. If you did not request this verification, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <div class="footer-logo">Jawaharlal Nehru Technological University Gurajada Vizianagaram</div>
          <div>Established by Andhra Pradesh Act No.22 of 2021</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Try Resend API if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "CertiShield <onboarding@resend.dev>";
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: `Verify your Email - CertiShield JNTUGV`,
        html: htmlContent
      });

      if (error) {
        console.error("❌ [RESEND API] Error sending email:", error.message || error);
      } else if (data && data.id) {
        console.log(`🚀 [RESEND API] Instant OTP email sent to ${toEmail} (ID: ${data.id})`);
        return true;
      }
    } catch (resendErr) {
      console.error("❌ [RESEND API] Exception:", resendErr.message);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("==================================================");
    console.warn("⚠️ [EMAIL SERVICE] SMTP Credentials not configured in backend/.env!");
    console.warn(`📩 [FALLBACK LOG] OTP for ${toEmail} is: ${otp}`);
    console.warn("==================================================");
    return false;
  }

  const senderEmail = process.env.SMTP_USER || "saikumaredakula@gmail.com";
  const mailOptions = {
    from: `"CertiShield JNTUGV" <${senderEmail}>`,
    to: toEmail,
    subject: `Verify your Email - CertiShield JNTUGV`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 [EMAIL SERVICE] Verification OTP email successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ [EMAIL SERVICE] Failed to send OTP email to ${toEmail}:`, error.message);
    console.warn("==================================================");
    console.warn(`📩 [FALLBACK LOG] OTP for ${toEmail} is: ${otp}`);
    console.warn("==================================================");
    return false;
  }
}

module.exports = {
  sendOtpEmail
};
