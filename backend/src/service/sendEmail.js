import { transporter } from "../config/email.js";

/**
 * Sends an email using Nodemailer over SMTP
 */
export const sendMailViaNodemailer = async ({ to, subject, message, html }) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_NAME || "SmartMail"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message,
    html: html || message.replace(/\n/g, "<br/>"),
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
