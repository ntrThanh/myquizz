// Cấu hình luyện tập dùng chung cho server, client và Zod. Thêm lựa chọn mới thì sửa ở đây
// (và thêm nhãn trong src/messages/), không viết cứng ở component.

import { TOPICS } from "@/lib/topics";

/** Cách trả lời: gõ đáp án hoặc chọn một trong nhiều phương án. */
export const PRACTICE_MODES = ["typing", "quiz"] as const;
export type PracticeMode = (typeof PRACTICE_MODES)[number];

/** Chiều hỏi của một câu: hiện từ ở ngôn ngữ trước, hỏi nghĩa ở ngôn ngữ sau. */
export const DIRECTIONS = ["en-vi", "vi-en"] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** Lựa chọn của người học: một chiều cố định, hoặc trộn ngẫu nhiên từng câu. */
export const DIRECTION_SETTINGS = [...DIRECTIONS, "mixed"] as const;
export type DirectionSetting = (typeof DIRECTION_SETTINGS)[number];

export const QUESTION_COUNTS = [10, 20, 30, 50] as const;
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

/** Luyện một chủ đề, hoặc mọi chủ đề. */
export const TOPIC_SETTINGS = ["all", ...TOPICS] as const;
export type TopicSetting = (typeof TOPIC_SETTINGS)[number];

export interface PracticeSettings {
  mode: PracticeMode;
  direction: DirectionSetting;
  count: QuestionCount;
  topic: TopicSetting;
  /** Bài trong chủ đề (đánh số từ 1); `null` = cả chủ đề. Chỉ có nghĩa khi đã chọn chủ đề. */
  lesson: number | null;
}

export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
  mode: "quiz",
  direction: "en-vi",
  count: 10,
  topic: "all",
  lesson: null,
};

/**
 * Số từ mỗi bài. Từ của một chủ đề xếp theo thứ tự học rồi cắt thành bài: thêm từ vào cuối
 * danh sách thì tự có bài mới, các bài cũ giữ nguyên.
 */
export const LESSON_SIZE = 50;

/** Số phương án mỗi câu trắc nghiệm (1 đúng + còn lại là nhiễu). */
export const QUIZ_OPTION_COUNT = 4;

/** Số từ lấy ngẫu nhiên làm kho phương án nhiễu cho một lượt trắc nghiệm. */
export const DISTRACTOR_POOL_SIZE = 60;
