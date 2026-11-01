import { ObjectId, type AnyBulkWriteOperation, type Document } from "mongodb";
import type { LifeTopic } from "../src/lib/topics";
import { run, withDb } from "./connect";
import { TOPIC_WORDS } from "./topic-words";

// Gán chủ đề đời sống cho các từ có sẵn trong `words` theo danh sách ở scripts/topic-words.ts:
//
//   npm run db:assign-topics              # chỉ gán chủ đề và thứ tự học
//   npm run db:assign-topics -- --publish # gán và đăng luôn các từ đó
//
// Chỉ thêm chủ đề (không bỏ chủ đề chuyên ngành đã có), và bỏ `general` vì từ đã có chủ đề cụ thể.
// Ghi `topicRanks` = vị trí của từ trong danh sách, để chia bài theo đúng thứ tự học.
// Idempotent: từ đã đúng chủ đề, thứ tự (và trạng thái nếu --publish) thì không ghi gì.
// Từ không có trong kho (chưa nạp từ điển) được đếm và liệt kê để thêm tay.

const GENERAL = "general";
const BATCH_SIZE = 500;
const MISSING_SHOWN = 60;

/** Gom ngược: từ → { chủ đề: vị trí trong danh sách của chủ đề đó }. */
function ranksByWord(): Map<string, Partial<Record<LifeTopic, number>>> {
  const map = new Map<string, Partial<Record<LifeTopic, number>>>();
  for (const [topic, words] of Object.entries(TOPIC_WORDS) as [LifeTopic, readonly string[]][]) {
    words.forEach((word, rank) => map.set(word, { ...map.get(word), [topic]: rank }));
  }
  return map;
}

run(async () => {
  const publish = process.argv.includes("--publish");
  await withDb(async (db) => {
    const words = db.collection("words");
    const wanted = ranksByWord();
    const existing = new Set(
      (
        await words
          .find({ word: { $in: [...wanted.keys()] } }, { projection: { word: 1 } })
          .toArray()
      ).map((d) => d.word as string),
    );

    const now = new Date();
    let changed = 0;
    let batch: AnyBulkWriteOperation<Document>[] = [];
    const flush = async () => {
      if (batch.length === 0) return;
      changed += (await words.bulkWrite(batch, { ordered: false })).modifiedCount;
      batch = [];
    };

    for (const [word, ranks] of wanted) {
      if (!existing.has(word)) continue;
      const topics = Object.keys(ranks);
      // Chỉ ghi khi còn thiếu chủ đề, còn `general`, sai thứ tự, hoặc (với --publish) chưa đăng.
      const needsChange = [
        { topics: { $not: { $all: topics } } },
        { topics: GENERAL },
        ...Object.entries(ranks).map(([topic, rank]) => ({
          [`topicRanks.${topic}`]: { $ne: rank },
        })),
        ...(publish ? [{ status: { $ne: "published" } }] : []),
      ];
      batch.push({
        updateMany: {
          filter: { word, $or: needsChange },
          update: [
            {
              $set: {
                topics: {
                  $setUnion: [
                    { $setDifference: [{ $ifNull: ["$topics", []] }, [GENERAL]] },
                    topics,
                  ],
                },
                topicRanks: { $mergeObjects: [{ $ifNull: ["$topicRanks", {}] }, ranks] },
                ...(publish ? { status: "published" } : {}),
                updatedAt: now,
              },
            },
          ],
        },
      });
      if (batch.length >= BATCH_SIZE) await flush();
    }
    await flush();

    if (changed > 0) {
      await db.collection("auditLogs").insertOne({
        _id: new ObjectId(),
        actorId: null,
        action: "word.assignTopics",
        target: { type: "word", id: "bulk" },
        meta: { changed, publish, via: "cli" },
        createdAt: now,
      });
    }

    const missing = [...wanted.keys()].filter((w) => !existing.has(w));
    console.log(
      `Đã cập nhật ${changed} từ (${existing.size} từ có trong kho${publish ? ", đã đăng" : ""}).`,
    );
    if (missing.length > 0) {
      const shown = missing.slice(0, MISSING_SHOWN).join(", ");
      const more = missing.length > MISSING_SHOWN ? ", …" : "";
      console.log(`${missing.length} từ chưa có trong kho, cần thêm tay: ${shown}${more}`);
    }
  });
});
