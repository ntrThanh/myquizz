import type { Migration } from "../types";

// Một từ thuộc được nhiều chủ đề: thêm `topics` (mảng), chép từ `topic`. Đổi field theo hai bước
// (CLAUDE.md §5.3): bước này chỉ thêm field mới và index; `topic` cũ cùng index của nó sẽ xóa ở
// một migration sau, khi không còn phiên bản app nào đọc nó.

const INDEXES = [
  { key: { topics: 1, _id: -1 }, name: "topics_1__id_-1" },
  { key: { topics: 1, status: 1, _id: -1 }, name: "topics_1_status_1__id_-1" },
] as const;

export const migration: Migration = {
  id: "0005-word-topics-array",
  async up(db) {
    const words = db.collection("words");
    await words.updateMany({ topics: { $exists: false } }, [
      { $set: { topics: [{ $ifNull: ["$topic", "general"] }] } },
    ]);
    for (const { key, name } of INDEXES) await words.createIndex(key, { name });
  },
  // Giữ `topics` khi quay lại: chủ đề gán thêm sau migration này không có chỗ trong `topic`.
  async down(db) {
    const words = db.collection("words");
    for (const { name } of INDEXES) await words.dropIndex(name).catch(() => {});
  },
};
