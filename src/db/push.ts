import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const pushSchema = async () => {
  try {
    console.log("🔄 Pushing schema to database...");

    const client = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(client, { schema });

    console.log("✅ Schema pushed successfully!");

    await client.end();
  } catch (error) {
    console.error("❌ Failed to push schema:", error);
    process.exit(1);
  }
};

pushSchema();
