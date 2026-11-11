import { NodemailerProvider } from "../../pkg/email/nodemailer.js";
import { BrevoProvider } from "../../pkg/email/brevo.js";
import { env } from "../config/env.js";

// Brevo when its key is set (hosted: SMTP ports are often blocked), SMTP otherwise
export const emailProvider = env.mail.brevoApiKey
  ? new BrevoProvider({ apiKey: env.mail.brevoApiKey, fromEmail: env.mail.user, fromName: env.mail.fromName })
  : new NodemailerProvider(env.mail);
