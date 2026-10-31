import type { Db, Document } from "mongodb";
import type { Migration } from "../types";

const objectId = { bsonType: "objectId" };
const date = { bsonType: "date" };
const str = (minLength = 1) => ({ bsonType: "string", minLength });
const status = { enum: ["draft", "published"] };
const sm2 = {
  n: { bsonType: "int", minimum: 0 },
  ef: { bsonType: ["double", "int"], minimum: 1.3 },
  interval: { bsonType: "int", minimum: 0 },
};

function schema(required: string[], properties: Document): Document {
  return { $jsonSchema: { bsonType: "object", required, properties } };
}

// JSON Schema validation cho các collection nội dung và tiến độ (CLAUDE.md §5.2).
const validators: Record<string, Document> = {
  courses: schema(["slug", "title", "status", "sort", "createdAt", "updatedAt"], {
    slug: { bsonType: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
    title: str(),
    description: str(0),
    status,
    sort: { bsonType: "int" },
    createdAt: date,
    updatedAt: date,
  }),
  lessons: schema(["courseId", "title", "status", "sort", "createdAt", "updatedAt"], {
    courseId: objectId,
    title: str(),
    status,
    sort: { bsonType: "int" },
    createdAt: date,
    updatedAt: date,
  }),
  words: schema(["lessonId", "courseId", "word", "meaningVi", "status", "createdAt", "updatedAt"], {
    lessonId: objectId,
    courseId: objectId,
    word: str(),
    meaningVi: str(),
    ipa: { bsonType: "string" },
    example: { bsonType: "string" },
    audioUrl: { bsonType: "string" },
    status,
    createdAt: date,
    updatedAt: date,
  }),
  userWordProgress: schema(
    ["userId", "wordId", "courseId", "lessonId", "n", "ef", "interval", "dueDate", "createdAt"],
    {
      userId: objectId,
      wordId: objectId,
      courseId: objectId,
      lessonId: objectId,
      ...sm2,
      dueDate: date,
      lastReviewedAt: { bsonType: ["date", "null"] },
      createdAt: date,
      updatedAt: date,
    },
  ),
  reviewLogs: schema(["userId", "wordId", "q", "mode", "reviewedAt"], {
    userId: objectId,
    wordId: objectId,
    q: { bsonType: "int", minimum: 0, maximum: 5 },
    mode: { enum: ["flashcard", "quiz", "typing"] },
    reviewedAt: date,
  }),
  auditLogs: schema(["actorId", "action", "target", "createdAt"], {
    actorId: { bsonType: ["objectId", "null"] },
    action: str(),
    target: {
      bsonType: "object",
      required: ["type", "id"],
      properties: { type: str(), id: str() },
    },
    createdAt: date,
  }),
};

type IndexSpec = [keys: Document, options?: Document];

const indexes: Record<string, IndexSpec[]> = {
  courses: [[{ slug: 1 }, { unique: true }], [{ status: 1, sort: 1 }]],
  lessons: [[{ courseId: 1, sort: 1 }]],
  words: [
    [{ lessonId: 1, status: 1 }],
    [{ word: "text", meaningVi: "text" }, { default_language: "none" }],
  ],
  userWordProgress: [[{ userId: 1, wordId: 1 }, { unique: true }], [{ userId: 1, dueDate: 1 }]],
  reviewLogs: [[{ userId: 1, reviewedAt: 1 }]],
  auditLogs: [[{ createdAt: 1 }], [{ actorId: 1, createdAt: 1 }]],
  // Collection của Better Auth (adapter không tự tạo index).
  users: [[{ email: 1 }, { unique: true }]],
  sessions: [[{ token: 1 }, { unique: true }], [{ userId: 1 }], [{ expiresAt: 1 }]],
  accounts: [[{ userId: 1 }], [{ providerId: 1, accountId: 1 }]],
  verifications: [[{ identifier: 1 }], [{ expiresAt: 1 }]],
};

async function exists(db: Db, name: string) {
  return (await db.listCollections({ name }, { nameOnly: true }).toArray()).length > 0;
}

export const migration: Migration = {
  id: "0002-core-collections",
  async up(db) {
    for (const [name, validator] of Object.entries(validators)) {
      if (await exists(db, name)) {
        await db.command({ collMod: name, validator, validationLevel: "moderate" });
      } else {
        await db.createCollection(name, { validator, validationLevel: "moderate" });
      }
    }
    for (const [name, specs] of Object.entries(indexes)) {
      for (const [keys, options] of specs) {
        await db.collection(name).createIndex(keys, options ?? {});
      }
    }
  },
  async down(db) {
    // Chỉ gỡ validator và index, không xóa dữ liệu.
    for (const name of Object.keys(validators)) {
      if (await exists(db, name)) await db.command({ collMod: name, validator: {} });
    }
    for (const name of Object.keys(indexes)) {
      if (await exists(db, name)) await db.collection(name).dropIndexes();
    }
  },
};
