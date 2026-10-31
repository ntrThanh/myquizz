import { MongoClient } from "mongodb";
import { z } from "zod";
import { migrations } from "./index";
import { getStatus, migrateDown, migrateUp } from "./runner";

// Chạy ngoài Next.js (tsx ở dev, file bundle trong image), nên tự đọc env.
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

async function main(command: string) {
  const client = new MongoClient(env.MONGODB_URI, {
    appName: "quizz-migrate",
    serverSelectionTimeoutMS: 10_000,
  });
  try {
    const db = client.db(env.MONGODB_DB);
    if (command === "up") {
      const done = await migrateUp(db, migrations);
      console.log(done.length ? `Đã chạy: ${done.join(", ")}` : "Không có migration mới.");
    } else if (command === "down") {
      const id = await migrateDown(db, migrations);
      console.log(id ? `Đã quay lại: ${id}` : "Chưa có migration nào để quay lại.");
    } else if (command === "status") {
      for (const s of await getStatus(db, migrations)) {
        console.log(
          `${s.appliedAt ? "✔" : "·"} ${s.id}${s.appliedAt ? `  ${s.appliedAt.toISOString()}` : ""}`,
        );
      }
    } else {
      throw new Error(`Lệnh không hợp lệ: ${command} (dùng up | down | status)`);
    }
  } finally {
    await client.close();
  }
}

main(process.argv[2] ?? "status").catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
