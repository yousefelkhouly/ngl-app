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
  // empty: Google sign-in is off
  GOOGLE_CLIENT_ID: z.string().default(""),
  // either one URL (hosted Redis like Upstash: rediss://default:<password>@<host>:6379,
  // rediss = TLS) or host/port/password (a local Redis)
  REDIS_URL: z.string().trim().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().default(""),
  // set: uploaded files go to Cloudinary (cloudinary://<key>:<secret>@<cloud name>).
  // unset: they stay in backend/uploads, which a host like Render wipes on every restart
  CLOUDINARY_URL: z.string().trim().optional(),
  CLOUDINARY_FOLDER: z.string().trim().default("unsaid"),
  // set: emails go through Brevo's HTTP API instead of SMTP (hosts often block SMTP ports).
  // MAIL_USER is then the sender address, which must be verified in Brevo
  BREVO_API_KEY: z.string().trim().optional(),
  // the defaults are Gmail's. MAIL_PASS for Gmail is an app password, not the account password
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().default(465),
  // "true" for port 465 (TLS from the start), "false" for 587 (STARTTLS)
  SMTP_SECURE: z.enum(["true", "false"]).default("true"),
  MAIL_USER: z.string().trim().min(1),
  // only for SMTP
  MAIL_PASS: z.string().trim().optional(),
  MAIL_FROM_NAME: z.string().trim().default("unsaid"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // shared with the frontend (same value in both): lets it tell the backend each visitor's
  // address. hosted, set it instead of guessing TRUST_PROXY. a long random string
  // an empty value (PROXY_SECRET= in a copied .env.example) means not set
  PROXY_SECRET: z.preprocess((value) => value || undefined, z.string().trim().min(32).optional()),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
}).refine((values) => values.BREVO_API_KEY || values.MAIL_PASS, {
  message: "set BREVO_API_KEY, or MAIL_PASS to send email over SMTP",
  path: ["MAIL_PASS"],
});

const parsed = schema.parse(process.env);

export const env = {
  isProduction: parsed.NODE_ENV === "production",
  port: Number(parsed.PORT),
  clientUrls: parsed.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/+$/, "")),
  trustProxy: parsed.TRUST_PROXY,
  proxySecret: parsed.PROXY_SECRET,
  cookieSameSite: parsed.COOKIE_SAME_SITE,
  db: {
    url: parsed.MONGODB_URL,
  },
  redis: {
    url: parsed.REDIS_URL,
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
    brevoApiKey: parsed.BREVO_API_KEY,
  },
  storage: {
    cloudinaryUrl: parsed.CLOUDINARY_URL,
    folder: parsed.CLOUDINARY_FOLDER,
  },
  google: {
    webClientId: parsed.GOOGLE_CLIENT_ID,
    iosClientId: parsed.GOOGLE_CLIENT_ID,
  },
  payment: {},
  aws: {},
};
