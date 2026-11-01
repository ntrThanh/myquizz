import type { Document } from "mongodb";
import type { Migration } from "../types";
import { validators as v0002 } from "./0002-core-collections";

// Từ vựng không còn bắt buộc thuộc khóa học/bài học: bỏ `courseId`, `lessonId` khỏi danh sách
// field bắt buộc của `words` và `userWordProgress`. Field cũ vẫn được giữ trong dữ liệu (không xóa).
// reviewLogs ghi thêm `direction` (en-vi | vi-en).

const objectId = { bsonType: "objectId" };
const date = { bsonType: "date" };
const str = (minLength = 1) => ({ bsonType: "string", minLength });
const status = { enum: ["draft", "published"] };

function schema(required: string[], properties: Document): Document {
  return { $jsonSchema: { bsonType: "object", required, properties } };
}

const validators: Record<string, Document> = {
  words: schema(["word", "meaningVi", "status", "createdAt", "updatedAt"], {
    word: str(),
    meaningVi: str(),
    ipa: { bsonType: "string" },
    example: { bsonType: "string" },
    status,
    createdAt: date,
    updatedAt: date,
  }),
  userWordProgress: schema(["userId", "wordId", "n", "ef", "interval", "dueDate", "createdAt"], {
    userId: objectId,
    wordId: objectId,
    n: { bsonType: "int", minimum: 0 },
    ef: { bsonType: ["double", "int"], minimum: 1.3 },
    interval: { bsonType: "int", minimum: 0 },
    dueDate: date,
    lastReviewedAt: { bsonType: ["date", "null"] },
    createdAt: date,
    updatedAt: date,
  }),
  reviewLogs: schema(["userId", "wordId", "q", "mode", "reviewedAt"], {
    userId: objectId,
    wordId: objectId,
    q: { bsonType: "int", minimum: 0, maximum: 5 },
    mode: { enum: ["flashcard", "quiz", "typing"] },
    direction: { enum: ["en-vi", "vi-en"] },
    reviewedAt: date,
  }),
};

/** Danh sách từ ở trang quản trị và lọc từ published khi luyện tập. */
const WORDS_STATUS_INDEX = "status_1_createdAt_-1";

export const migration: Migration = {
  id: "0003-standalone-words",
  async up(db) {
    for (const [name, validator] of Object.entries(validators)) {
      await db.command({ collMod: name, validator, validationLevel: "moderate" });
    }
    await db
      .collection("words")
      .createIndex({ status: 1, createdAt: -1 }, { name: WORDS_STATUS_INDEX });
  },
  async down(db) {
    for (const name of Object.keys(validators)) {
      await db.command({ collMod: name, validator: v0002[name], validationLevel: "moderate" });
    }
    await db
      .collection("words")
      .dropIndex(WORDS_STATUS_INDEX)
      .catch(() => {});
  },
};
