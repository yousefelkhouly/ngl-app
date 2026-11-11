import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// settings shared by playwright.config.ts, global setup/teardown and the tests

export const FRONTEND_PORT = 3055;
export const BACKEND_PORT = 5055;
export const TEST_DB_NAME = "ngl_e2e_test";

export const backendDir = path.resolve(__dirname, "../../../backend");
export const mailLog = path.resolve(__dirname, "../../test-results/mail.log");
// a file:// URL: node --import doesn't accept Windows drive paths
export const mailStub = pathToFileURL(path.resolve(__dirname, "mail-stub/register.mjs")).href;

// the backend's MONGODB_URL with the database swapped for a throwaway one,
// so the tests never touch real data
export function testMongoUrl(): string {
  const env = readFileSync(path.join(backendDir, ".env"), "utf8");
  const line = env.split(/\r?\n/).find((entry) => /^\s*MONGODB_URL\s*=/.test(entry));
  if (!line) throw new Error("MONGODB_URL is missing from backend/.env");
  const url = new URL(line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""));
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}
