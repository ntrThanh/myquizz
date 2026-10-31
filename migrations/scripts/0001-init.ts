import type { Migration } from "../types";

export const migration: Migration = {
  id: "0001-init",
  async up(db) {
    await db.collection("_migrations").createIndex({ appliedAt: 1 });
  },
  async down(db) {
    await db
      .collection("_migrations")
      .dropIndex("appliedAt_1")
      .catch(() => {});
  },
};
