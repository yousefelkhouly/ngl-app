import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { mailLog } from "./environment";
import { dropTestDatabase } from "./database";

export default async function globalSetup() {
  mkdirSync(path.dirname(mailLog), { recursive: true });
  writeFileSync(mailLog, "");
  await dropTestDatabase();
}
