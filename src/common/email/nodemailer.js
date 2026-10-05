import nodemailer from "nodemailer";
export function sendEmail(to, subject, html) {
  console.log("MAIL_USER:", process.env.MAIL_USER);
  console.log("MAIL_PASS exists:", !!process.env.MAIL_PASS);
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  transporter.sendMail({
    from: `"NGL-APP"<${process.env.MAIL_USER}>`,
    to: to,
    subject: subject,
    html: html,
  });
}
