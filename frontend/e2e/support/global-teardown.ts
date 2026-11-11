import { dropTestDatabase } from "./database";

export default async function globalTeardown() {
  await dropTestDatabase();
}
