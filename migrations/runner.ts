import { MongoServerError, type Db } from "mongodb";
import type { Migration } from "./types";

const STATE = "_migrations";
const LOCK = "_migrations_lock";
const STALE_LOCK_MS = 15 * 60 * 1000;

interface MigrationDoc {
  _id: string;
  appliedAt: Date;
}

interface LockDoc {
  _id: "lock";
  lockedAt: Date;
}

export interface MigrationStatus {
  id: string;
  appliedAt: Date | null;
}

function assertOrdered(migrations: Migration[]) {
  const ids = migrations.map((m) => m.id);
  const sorted = [...ids].sort();
  if (new Set(ids).size !== ids.length || ids.some((id, i) => id !== sorted[i])) {
    throw new Error(`Danh sách migration phải duy nhất và tăng dần: ${ids.join(", ")}`);
  }
}

async function withLock<T>(db: Db, fn: () => Promise<T>): Promise<T> {
  const locks = db.collection<LockDoc>(LOCK);
  try {
    await locks.insertOne({ _id: "lock", lockedAt: new Date() });
  } catch (err) {
    if (!(err instanceof MongoServerError && err.code === 11000)) throw err;
    // Lock cũ do tiến trình chết để lại: chiếm lại nếu đã quá hạn.
    const taken = await locks.findOneAndUpdate(
      { _id: "lock", lockedAt: { $lt: new Date(Date.now() - STALE_LOCK_MS) } },
      { $set: { lockedAt: new Date() } },
    );
    if (!taken) throw new Error("Đang có tiến trình migration khác chạy.");
  }
  try {
    return await fn();
  } finally {
    await locks.deleteOne({ _id: "lock" });
  }
}

export async function getStatus(db: Db, migrations: Migration[]): Promise<MigrationStatus[]> {
  assertOrdered(migrations);
  const applied = await db.collection<MigrationDoc>(STATE).find().toArray();
  const byId = new Map(applied.map((d) => [d._id, d.appliedAt]));
  return migrations.map((m) => ({ id: m.id, appliedAt: byId.get(m.id) ?? null }));
}

/** Chạy các migration chưa áp dụng theo thứ tự. Trả về id đã chạy. */
export async function migrateUp(db: Db, migrations: Migration[]): Promise<string[]> {
  return withLock(db, async () => {
    const status = await getStatus(db, migrations);
    const done: string[] = [];
    for (const [i, m] of migrations.entries()) {
      if (status[i]?.appliedAt) continue;
      await m.up(db);
      await db
        .collection<MigrationDoc>(STATE)
        .updateOne({ _id: m.id }, { $set: { appliedAt: new Date() } }, { upsert: true });
      done.push(m.id);
    }
    return done;
  });
}

/** Quay lại đúng một migration gần nhất đã áp dụng. */
export async function migrateDown(db: Db, migrations: Migration[]): Promise<string | null> {
  return withLock(db, async () => {
    const status = await getStatus(db, migrations);
    const last = status.findLast((s) => s.appliedAt);
    if (!last) return null;
    const m = migrations.find((x) => x.id === last.id)!;
    if (!m.down) throw new Error(`Migration ${m.id} không có hướng down.`);
    await m.down(db);
    await db.collection<MigrationDoc>(STATE).deleteOne({ _id: m.id });
    return m.id;
  });
}
