const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const isGmail = host.includes('gmail.com');

  const config = {
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (isGmail && port === 587) {
    config.tls = {
      rejectUnauthorized: true,
    };
  }

  return nodemailer.createTransport(config);
};

/**
 * Send an email using Nodemailer and Gmail SMTP.
 * @param {{to: string, subject: string, html: string, text?: string}} options
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.NODE_ENV === 'test') {
    return { accepted: [to], response: '250 Test OK', messageId: 'test-message-id' };
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'Gmail SMTP credentials (SMTP_USER and SMTP_PASS) are not configured in server/.env.'
    );
  }

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `PRERNA <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...(text && { text }),
    });
    return info;
  } catch (err) {
    console.error(`SMTP Email Delivery Error for recipient ${to}:`, err.message);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

module.exports = sendEmail;
