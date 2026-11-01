import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { AnyBulkWriteOperation, Db, Document } from "mongodb";
import { run, withDb } from "./connect";
import { parseEntry } from "./fvdp/parse";

// Nạp từ điển Anh–Việt FVDP (Free Vietnamese Dictionary Project, giấy phép GPL) từ file SQLite
// vào `words`, ở trạng thái draft để editor duyệt và đăng dần.
//
//   npm run db:import:fvdp -- <đường-dẫn.db>
//
// Idempotent: upsert theo `word`, nên chạy lại không nhân đôi. Từ đã có sẵn không bị ghi đè,
// trừ từ do chính script này nạp mà chưa ai đụng tới (vẫn draft, `updatedAt` = `createdAt`): những
// từ đó được cập nhật theo cách phân tích mới nhất. Từ editor đã sửa hoặc đã đăng thì giữ nguyên.

const SOURCE = "fvdp";
const SOURCE_NAME = "FVDP%";
const BATCH_SIZE = 1000;

interface Row {
  wordId: number;
  word: string;
  html: string;
}

/** Gom các dòng nghĩa liên tiếp của cùng một từ (truy vấn đã sắp theo word_id). */
function* entries(rows: Iterable<Row>) {
  let current: { word: string; htmls: string[]; id: number } | undefined;
  for (const row of rows) {
    if (current && current.id === row.wordId) {
      current.htmls.push(row.html);
      continue;
    }
    if (current) yield current;
    current = { id: row.wordId, word: row.word, htmls: [row.html] };
  }
  if (current) yield current;
}

async function importFile(db: Db, file: string) {
  const sqlite = new DatabaseSync(file, { readOnly: true });
  const rows = sqlite
    .prepare(
      `SELECT w.id AS wordId, w.word AS word, m.meaning_text AS html
       FROM meanings m JOIN words w ON w.id = m.word_id
       WHERE m.source_id IN (SELECT id FROM sources WHERE name LIKE ?)
       ORDER BY w.id, m.id`,
    )
    .iterate(SOURCE_NAME) as Iterable<Row>;

  const words = db.collection("words");
  const now = new Date();
  const stats = { read: 0, skipped: 0, inserted: 0, refreshed: 0 };
  const topics = new Map<string, number>();
  let batch: AnyBulkWriteOperation<Document>[] = [];

  async function flush() {
    if (batch.length === 0) return;
    const res = await words.bulkWrite(batch, { ordered: false });
    stats.inserted += res.upsertedCount;
    stats.refreshed += res.modifiedCount;
    batch = [];
    console.log(`… đã xử lý ${stats.read} mục, thêm mới ${stats.inserted}`);
  }

  try {
    for (const { word, htmls } of entries(rows)) {
      stats.read++;
      const parsed = parseEntry(word, htmls);
      if (!parsed) {
        stats.skipped++;
        continue;
      }
      const { example, ...fields } = parsed;
      batch.push({
        updateOne: {
          filter: {
            word: parsed.word,
            source: SOURCE,
            status: "draft",
            $expr: { $eq: ["$createdAt", "$updatedAt"] },
          },
          update: example
            ? { $set: { ...fields, example } }
            : { $set: fields, $unset: { example: "" } },
        },
      });
      batch.push({
        updateOne: {
          filter: { word: parsed.word },
          update: {
            $setOnInsert: {
              ...parsed,
              status: "draft",
              source: SOURCE,
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      });
      topics.set(parsed.topic, (topics.get(parsed.topic) ?? 0) + 1);
      if (batch.length >= BATCH_SIZE * 2) await flush();
    }
    await flush();
  } finally {
    sqlite.close();
  }

  console.log(
    `Xong: đọc ${stats.read} mục, bỏ qua ${stats.skipped}, thêm mới ${stats.inserted}, ` +
      `cập nhật ${stats.refreshed} từ nạp trước đó.`,
  );
  console.log("Theo chủ đề:", Object.fromEntries([...topics].sort((a, b) => b[1] - a[1])));
}

run(async () => {
  const file = process.argv[2];
  if (!file || !existsSync(file)) {
    throw new Error("Cách dùng: npm run db:import:fvdp -- <đường-dẫn-tới-file.db>");
  }
  await withDb((db) => importFile(db, file));
});
