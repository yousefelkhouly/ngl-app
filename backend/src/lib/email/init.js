import { NodemailerProvider } from "../../pkg/email/nodemailer.js";
import { env } from "../config/env.js";

export const emailProvider = new NodemailerProvider(env.mail);
