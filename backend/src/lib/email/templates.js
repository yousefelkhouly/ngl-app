import { env } from "../config/env.js";

// the site's name, whatever MAIL_FROM_NAME says the sender is called
const APP_NAME = "unsaid";
// the first CLIENT_URL is the site people know
const SITE_URL = env.clientUrls[0];

// the code emails people get. each says what the code is for, so one arriving
// unexpectedly is a warning sign rather than noise
export const CODE_EMAILS = {
  verifyAccount: {
    subject: `Your ${APP_NAME} verification code`,
    heading: "Confirm your email",
    intro: `Enter this code to finish creating your ${APP_NAME} account.`,
  },
  resetPassword: {
    subject: `Reset your ${APP_NAME} password`,
    heading: "Reset your password",
    intro: "Enter this code to choose a new password.",
  },
  login: {
    subject: `Your ${APP_NAME} sign-in code`,
    heading: "Finish signing in",
    intro: "You have 2-step verification on. Enter this code to finish signing in.",
  },
  twoStepOn: {
    subject: `Turn on 2-step verification for ${APP_NAME}`,
    heading: "Turn on 2-step verification",
    intro: "Enter this code in your profile to turn on 2-step verification.",
  },
  twoStepOff: {
    subject: `Turn off 2-step verification for ${APP_NAME}`,
    heading: "Turn off 2-step verification",
    intro: "Enter this code in your profile to turn off 2-step verification.",
  },
  changeEmail: {
    subject: `Confirm your new ${APP_NAME} email`,
    heading: "Confirm your new email",
    intro: `Enter this code in your profile to move your ${APP_NAME} account to this address.`,
  },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// html email clients ignore stylesheets, so everything is inline. kept free of any run of
// six digits besides the code, so a glance (or a test) finds the code first
export function codeEmail(kind, code) {
  const { subject, heading, intro } = CODE_EMAILS[kind];
  const footer = `Didn't ask for this? You can ignore this email: nothing changes without the code. It expires in 5 minutes.`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#eef0fb;font-family:Helvetica,Arial,sans-serif;color:#0b0b14">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fff;border:2px solid #0b0b14;border-radius:6px">
      <tr><td style="padding:20px 28px;background:#1f3bff;color:#fff;font-size:20px;font-weight:800;border-radius:4px 4px 0 0">${escapeHtml(APP_NAME)}</td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;font-size:24px">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.5">${escapeHtml(intro)}</p>
        <p style="margin:0 0 20px;font-size:34px;font-weight:800;letter-spacing:8px;font-family:Menlo,Consolas,monospace">${escapeHtml(code)}</p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#4a4a63">${escapeHtml(footer)}</p>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:2px solid #0b0b14;font-size:12px;color:#4a4a63">
        <a href="${escapeHtml(SITE_URL)}" style="color:#0b0b14">${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}</a>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${heading}\n\n${intro}\n\n${code}\n\n${footer}\n\n${SITE_URL}`;
  return { subject, html, text };
}
