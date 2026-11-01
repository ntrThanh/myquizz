import type { Migration } from "../types";

// Từ vựng có chủ đề (`topic`). Từ có sẵn chưa có chủ đề thì gán `general`.
// Thêm index cho tìm theo `word` (nạp từ điển upsert theo từ) và cho danh sách quản trị: lọc theo
// trạng thái và/hoặc chủ đề, sắp mới nhất trước theo `_id`. Kho từ có thể hàng trăm nghìn mục nên
// mọi tổ hợp lọc đều cần index để không phải sắp xếp trong bộ nhớ.
// Không đổi validator: field mới vẫn hợp lệ với validator hiện tại, nên không cần quyền collMod.

const DEFAULT_TOPIC = "general";
const INDEXES = [
  { key: { word: 1 }, name: "word_1" },
  { key: { status: 1, _id: -1 }, name: "status_1__id_-1" },
  { key: { topic: 1, _id: -1 }, name: "topic_1__id_-1" },
  { key: { topic: 1, status: 1, _id: -1 }, name: "topic_1_status_1__id_-1" },
] as const;

export const migration: Migration = {
  id: "0004-word-topics",
  async up(db) {
    const words = db.collection("words");
    await words.updateMany({ topic: { $exists: false } }, { $set: { topic: DEFAULT_TOPIC } });
    for (const { key, name } of INDEXES) await words.createIndex(key, { name });
  },
  // Giữ field `topic` khi quay lại: không phân biệt được chủ đề gán tự động với chủ đề editor đã chọn.
  async down(db) {
    const words = db.collection("words");
    for (const { name } of INDEXES) await words.dropIndex(name).catch(() => {});
  },
};
