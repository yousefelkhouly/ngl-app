import nodemailer from "nodemailer";

export class NodemailerProvider {
  transporter;
  from;

  constructor(config) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      // keep the connection open and reuse it: opening one (connect, TLS, login)
      // takes ~0.9s with Gmail, which every sign-in and sign-up would otherwise wait for
      pool: true,
      maxConnections: 3,
    });
    // Gmail (and most providers) only send from the account that logs in
    this.from = { name: config.fromName, address: config.user };
  }

  async sendmail(email, subject, html, text) {
    return this.transporter.sendMail({ from: this.from, to: email, subject, html, text });
  }

  // logs in to the SMTP server without sending anything
  async verify() {
    return this.transporter.verify();
  }
}
