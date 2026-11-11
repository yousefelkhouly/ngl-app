import { createRequire } from "node:module";
import path from "node:path";
import { TEST_DB_NAME, backendDir, testMongoUrl } from "./environment";

// the backend already depends on the mongodb driver; borrow it instead of adding one here
const requireFromBackend = createRequire(path.join(backendDir, "package.json"));

// the few driver methods used here
interface MongoClientLike {
  db(): { databaseName: string; dropDatabase(): Promise<boolean> };
  close(): Promise<void>;
}
const { MongoClient } = requireFromBackend("mongodb") as {
  MongoClient: { connect(url: string): Promise<MongoClientLike> };
};

export async function dropTestDatabase() {
  const client = await MongoClient.connect(testMongoUrl());
  try {
    const db = client.db();
    // a guard against ever dropping the real database
    if (db.databaseName !== TEST_DB_NAME) throw new Error(`refusing to drop ${db.databaseName}`);
    await db.dropDatabase();
  } finally {
    await client.close();
  }
}
