import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendEmail(to, subject, html) {
  console.log("MAIL_USER:", process.env.MAIL_USER);
  console.log("MAIL_PASS exists:", !!process.env.MAIL_PASS);

  await transporter.sendMail({
    from: `"NGL-APP"<${process.env.MAIL_USER}>`,
    to: to,
    subject: subject,
    html: html,
  });
}
