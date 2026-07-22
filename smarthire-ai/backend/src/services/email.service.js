const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Sends an email using SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
async function sendEmail(to, subject, html) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email.service] SENDGRID_API_KEY missing. Skipping email to:', to);
    return false;
  }

  const fromEmail = process.env.FROM_EMAIL || 'noreply@smarthire.ai';

  const msg = {
    to,
    from: fromEmail,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('[email.service] Error sending email:', error.response?.body || error.message);
    return false;
  }
}

module.exports = { sendEmail };
