import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.warn("[Nodemailer] SMTP Connection Warning:", error.message);
  } else {
    console.log("[Nodemailer] SMTP Server is ready to send messages");
  }
});
