import { MongoClient, type Db } from "mongodb";
import { z } from "zod";

// Dùng chung cho các script vận hành chạy ngoài Next.js (như migrations/).
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== "production") {
    try {
      process.loadEnvFile(".env");
    } catch {
      // Không có .env: dùng biến môi trường sẵn có.
    }
  }
  const env = z
    .object({ MONGODB_URI: z.string().min(1), MONGODB_DB: z.string().min(1) })
    .parse(process.env);
  const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  try {
    return await fn(client.db(env.MONGODB_DB));
  } finally {
    await client.close();
  }
}

export function run(main: () => Promise<void>) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
