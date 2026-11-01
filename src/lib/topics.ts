// Chủ đề của từ vựng, dùng để lọc khi luyện tập và khi quản trị. Một từ có thể thuộc nhiều chủ đề.
// Thêm chủ đề mới thì thêm vào một nhóm ở đây và thêm nhãn ở `topics` trong src/messages/.

/** Chủ đề đời sống: danh sách từ cốt lõi do người soạn (scripts/topic-words/). */
export const LIFE_TOPICS = [
  "family",
  "friends",
  "people",
  "body-health",
  "food-drink",
  "home",
  "clothes",
  "shopping",
  "school",
  "work",
  "travel",
  "transportation",
  "weather-nature",
  "animals",
  "sports-hobbies",
  "music-film",
  "technology-life",
  "time-numbers",
  "emotions",
  "daily-communication",
] as const;

/** Chủ đề chuyên ngành và nhóm còn lại, gán tự động khi nạp từ điển. */
export const FIELD_TOPICS = [
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

export const TOPICS = [...LIFE_TOPICS, ...FIELD_TOPICS] as const;
export type Topic = (typeof TOPICS)[number];
export type LifeTopic = (typeof LIFE_TOPICS)[number];

/** Nhóm hiển thị ở trang luyện tập và form sửa từ (nhãn ở `topicGroups` trong src/messages/). */
export const TOPIC_GROUPS = { life: LIFE_TOPICS, field: FIELD_TOPICS } as const;
export type TopicGroup = keyof typeof TOPIC_GROUPS;

/** Chủ đề mặc định cho từ thêm tay và từ chưa phân loại. */
export const DEFAULT_TOPIC: Topic = "general";

/** Số chủ đề tối đa của một từ. */
export const MAX_TOPICS_PER_WORD = 8;
