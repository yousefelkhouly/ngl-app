import { appendFileSync } from "node:fs";

// same shape as the parts of nodemailer the backend uses, but every email is appended to
// E2E_MAIL_LOG (one JSON per line) instead of being sent
function createTransport() {
  return {
    async sendMail(message) {
      const line = { to: message.to, subject: message.subject, html: message.html };
      appendFileSync(process.env.E2E_MAIL_LOG, `${JSON.stringify(line)}\n`);
      return { messageId: `<stub-${Date.now()}@e2e>`, accepted: [message.to] };
    },
    async verify() {
      return true;
    },
  };
}

const nodemailer = { createTransport };
export default nodemailer;
export { createTransport };
