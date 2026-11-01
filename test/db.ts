import { ObjectId } from "mongodb";
import { describe } from "vitest";
import { migrations } from "../migrations";
import { migrateUp } from "../migrations/runner";
import type { Topic } from "@/lib/topics";
import type { Actor } from "@/server/auth/roles";
import { getDb, getMongoClient } from "@/server/db/client";
import { collections } from "@/server/db/collections";

/** describe chỉ chạy khi có Mongo test (cần replica set vì DAL dùng transaction). */
export const describeDb = describe.skipIf(!process.env.MONGODB_TEST_URI);

export async function resetDb() {
  await getDb().dropDatabase();
  await migrateUp(getDb(), migrations);
}

export async function closeDb() {
  await getDb().dropDatabase();
  await getMongoClient().close();
}

export function makeActor(role: Actor["role"], name: string = role): Actor {
  return {
    id: new ObjectId().toHexString(),
    name,
    email: `${name}@test.local`,
    role,
    timeZone: "Asia/Ho_Chi_Minh",
  };
}

export async function insertUser(actor: Actor) {
  const now = new Date();
  await collections.users().insertOne({
    _id: new ObjectId(actor.id),
    name: actor.name,
    email: actor.email,
    emailVerified: false,
    role: actor.role,
    timeZone: actor.timeZone,
    createdAt: now,
    updatedAt: now,
  });
}

/** `published` từ published (`w0`, `w1`…) và `draft` từ draft (`d0`, `d1`…), cùng một chủ đề. */
export async function seedWords(published = 5, draft = 2, topic: Topic = "general") {
  const now = new Date();
  const words = (n: number, prefix: string, status: "published" | "draft") =>
    Array.from({ length: n }, (_, i) => ({
      _id: new ObjectId(),
      word: `${prefix}${i}`,
      meaningVi: `nghĩa ${prefix}${i}`,
      topic,
      status,
      createdAt: now,
      updatedAt: now,
    }));
  const pub = words(published, "w", "published");
  const drafts = words(draft, "d", "draft");
  if (pub.length + drafts.length > 0) await collections.words().insertMany([...pub, ...drafts]);
  return {
    publishedIds: pub.map((w) => w._id.toHexString()),
    draftIds: drafts.map((w) => w._id.toHexString()),
  };
}
