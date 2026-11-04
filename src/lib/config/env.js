import { config } from "dotenv";
import { z } from "zod";

config();

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
  MAILJET_FROM_MAIL: z.string(),
  MAILJET_FROM_NAME: z.string(),
  API_MAILJET_KEY: z.string(),
  API_MAILJET_SECRET: z.string(),
});

const parsed = schema.parse(process.env);

export const env = {
  isProduction: parsed.NODE_ENV === "production",
  port: Number(parsed.PORT),
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
  mailjet: {
    apiKey: parsed.API_MAILJET_KEY,
    apiSecret: parsed.API_MAILJET_SECRET,
    fromEmail: parsed.MAILJET_FROM_MAIL,
    fromName: parsed.MAILJET_FROM_NAME,
  },
  google: {
    webClientId: parsed.GOOGLE_CLIENT_ID,
    iosClientId: parsed.GOOGLE_CLIENT_ID,
  },
  payment: {},
  aws: {},
};
