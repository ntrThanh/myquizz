import { ObjectId } from "mongodb";
import { describe } from "vitest";
import { migrations } from "../migrations";
import { migrateUp } from "../migrations/runner";
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

/** Một khóa published (1 bài, `wordCount` từ) và một khóa draft (1 bài, 2 từ). */
export async function seedContent(wordCount = 5) {
  const now = new Date();
  const t = { createdAt: now, updatedAt: now };
  const pub = { courseId: new ObjectId(), lessonId: new ObjectId() };
  const draft = { courseId: new ObjectId(), lessonId: new ObjectId() };

  await collections.courses().insertMany([
    {
      _id: pub.courseId,
      slug: "co-ban",
      title: "Cơ bản",
      description: "",
      status: "published",
      sort: 1,
      ...t,
    },
    {
      _id: draft.courseId,
      slug: "nhap",
      title: "Nháp",
      description: "",
      status: "draft",
      sort: 2,
      ...t,
    },
  ]);
  await collections.lessons().insertMany([
    {
      _id: pub.lessonId,
      courseId: pub.courseId,
      title: "Bài 1",
      status: "published",
      sort: 1,
      ...t,
    },
    {
      _id: draft.lessonId,
      courseId: draft.courseId,
      title: "Bài nháp",
      status: "draft",
      sort: 1,
      ...t,
    },
  ]);
  const words = (n: number, ids: typeof pub, prefix: string) =>
    Array.from({ length: n }, (_, i) => ({
      _id: new ObjectId(),
      lessonId: ids.lessonId,
      courseId: ids.courseId,
      word: `${prefix}${i}`,
      meaningVi: `nghĩa ${prefix}${i}`,
      status: "published" as const,
      ...t,
    }));
  await collections.words().insertMany([...words(wordCount, pub, "w"), ...words(2, draft, "d")]);

  return {
    pubCourseId: pub.courseId.toHexString(),
    pubLessonId: pub.lessonId.toHexString(),
    draftLessonId: draft.lessonId.toHexString(),
  };
}
