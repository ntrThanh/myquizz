import { MongoClient, type Db } from "mongodb";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getStatus, migrateDown, migrateUp } from "./runner";
import type { Migration } from "./types";

// Test tích hợp: chỉ chạy khi có MONGODB_TEST_URI. User trong URI phải được tạo/xóa DB
// `quizz_test_*` (ở dev dùng tài khoản root của Mongo trong Docker, không dùng user của app).
const uri = process.env.MONGODB_TEST_URI;

describe.skipIf(!uri)("migration runner", () => {
  let client: MongoClient;
  let db: Db;
  const calls: string[] = [];

  const list: Migration[] = [
    {
      id: "0001-a",
      up: async (d) => void (await d.collection("t").createIndex({ a: 1 }), calls.push("up a")),
      down: async () => void calls.push("down a"),
    },
    {
      id: "0002-b",
      up: async () => void calls.push("up b"),
      down: async () => void calls.push("down b"),
    },
  ];

  beforeAll(async () => {
    client = await MongoClient.connect(uri!);
    db = client.db(`quizz_test_migrations_${process.pid}`);
  });

  beforeEach(async () => {
    calls.length = 0;
    await db.dropDatabase();
  });

  afterAll(async () => {
    await db.dropDatabase();
    await client.close();
  });

  it("chạy theo thứ tự và idempotent", async () => {
    expect(await migrateUp(db, list)).toEqual(["0001-a", "0002-b"]);
    expect(await migrateUp(db, list)).toEqual([]);
    expect(calls).toEqual(["up a", "up b"]);
    expect((await getStatus(db, list)).every((s) => s.appliedAt)).toBe(true);
  });

  it("down quay lại đúng một bước", async () => {
    await migrateUp(db, list);
    expect(await migrateDown(db, list)).toBe("0002-b");
    expect((await getStatus(db, list)).map((s) => !!s.appliedAt)).toEqual([true, false]);
  });

  it("từ chối khi đang có lock", async () => {
    await db
      .collection("_migrations_lock")
      .insertOne({ _id: "lock" as never, lockedAt: new Date() });
    await expect(migrateUp(db, list)).rejects.toThrow(/khác chạy/);
  });

  it("từ chối danh sách sai thứ tự", async () => {
    await expect(migrateUp(db, [list[1]!, list[0]!])).rejects.toThrow(/tăng dần/);
  });
});
