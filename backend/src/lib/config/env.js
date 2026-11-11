import { config } from "dotenv";
import { fileURLToPath } from "url";
import { z } from "zod";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

export const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.string().default("5000"),
  MONGODB_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string(),
  // the defaults are Gmail's. MAIL_PASS for Gmail is an app password, not the account password
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().default(465),
  // "true" for port 465 (TLS from the start), "false" for 587 (STARTTLS)
  SMTP_SECURE: z.enum(["true", "false"]).default("true"),
  MAIL_USER: z.string().trim().min(1),
  MAIL_PASS: z.string().trim().min(1),
  MAIL_FROM_NAME: z.string().trim().default("unsaid"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
});

const parsed = schema.parse(process.env);

export const env = {
  isProduction: parsed.NODE_ENV === "production",
  port: Number(parsed.PORT),
  clientUrls: parsed.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/+$/, "")),
  trustProxy: parsed.TRUST_PROXY,
  cookieSameSite: parsed.COOKIE_SAME_SITE,
  db: {
    url: parsed.MONGODB_URL,
  },
  redis: {
    host: parsed.REDIS_HOST,
    port: Number(parsed.REDIS_PORT),
    password: parsed.REDIS_PASSWORD,
  },
  secret: {
    jwt: parsed.JWT_SECRET,
    jwtRefresh: parsed.JWT_REFRESH_SECRET,
  },
  mail: {
    host: parsed.SMTP_HOST,
    port: parsed.SMTP_PORT,
    secure: parsed.SMTP_SECURE === "true",
    user: parsed.MAIL_USER,
    pass: parsed.MAIL_PASS,
    fromName: parsed.MAIL_FROM_NAME,
  },
  google: {
    webClientId: parsed.GOOGLE_CLIENT_ID,
    iosClientId: parsed.GOOGLE_CLIENT_ID,
  },
  payment: {},
  aws: {},
};
