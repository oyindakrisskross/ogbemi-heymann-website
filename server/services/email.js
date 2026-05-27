import nodemailer from "nodemailer";
import { config } from "../config.js";

function hasSmtpConfig() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.password);
}

export async function sendArtistNotification({ subject, text }) {
  if (!hasSmtpConfig()) {
    console.info(`Email skipped because SMTP is not configured: ${subject}`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password
    }
  });

  await transporter.sendMail({
    from: config.smtp.from,
    to: config.artistEmail,
    subject,
    text
  });

  return { skipped: false };
}
