// Chủ đề của từ vựng, dùng để lọc khi luyện tập và khi quản trị. Thêm chủ đề mới thì thêm vào
// đây và thêm nhãn ở `topics` trong src/messages/.

export const TOPICS = [
  "general",
  "economics",
  "technology",
  "computing",
  "medicine",
  "biology",
  "chemistry",
  "physics",
  "math",
  "geography",
  "law",
  "military",
  "transport",
  "arts",
  "sports",
  "humanities",
  "agriculture",
  "specialized",
] as const;
export type Topic = (typeof TOPICS)[number];

/** Chủ đề mặc định cho từ thêm tay và từ có sẵn trước khi có chủ đề. */
export const DEFAULT_TOPIC: Topic = "general";
