const { query } = require("../config/db");
const { sendOtpEmail } = require("./emailService");

/**
 * Sends event notification emails and logs dispatch status in email_logs.
 */
async function sendNotificationEmail({ recipientEmail, subject, eventType, messageBody }) {
  let status = "SENT";
  let errorMessage = null;

  try {
    console.log(`📧 [Notification Email] Dispatching ${eventType} email to ${recipientEmail}...`);
    // Attempt dispatch via existing email service mechanism if configured
    await sendOtpEmail(recipientEmail, messageBody, "Student / Recipient");
  } catch (err) {
    status = "FAILED";
    errorMessage = err.message || "Email send failure";
    console.error(`❌ [Notification Email Error] Failed to send email to ${recipientEmail}:`, err.message);
  }

  try {
    await query(
      `INSERT INTO email_logs (recipient_email, subject, event_type, status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [recipientEmail, subject, eventType, status, errorMessage]
    );
  } catch (dbErr) {
    console.error("❌ [Email Log DB Error] Failed to record email log:", dbErr.message);
  }

  return status === "SENT";
}

module.exports = {
  sendNotificationEmail
};
