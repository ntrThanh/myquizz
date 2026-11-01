import { z } from "zod";
import {
  DEFAULT_PRACTICE_SETTINGS as DEFAULTS,
  DIRECTION_SETTINGS,
  DIRECTIONS,
  PRACTICE_MODES,
  QUESTION_COUNTS,
  TOPIC_SETTINGS,
  type PracticeSettings,
} from "@/lib/practice/config";
import { objectIdSchema } from "@/lib/validation";

/** searchParams có thể là mảng khi lặp tham số (`?mode=a&mode=b`): lấy giá trị đầu. */
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** Cài đặt lượt luyện đọc từ URL. Giá trị thiếu hoặc sai thì dùng mặc định, không báo lỗi. */
export const practiceSettingsSchema = z.object({
  mode: z.preprocess(first, z.enum(PRACTICE_MODES)).catch(DEFAULTS.mode),
  direction: z.preprocess(first, z.enum(DIRECTION_SETTINGS)).catch(DEFAULTS.direction),
  count: z
    .preprocess(first, z.coerce.number().pipe(z.literal(QUESTION_COUNTS)))
    .catch(DEFAULTS.count),
  topic: z.preprocess(first, z.enum(TOPIC_SETTINGS)).catch(DEFAULTS.topic),
});

export function parsePracticeSettings(searchParams: unknown): PracticeSettings {
  return practiceSettingsSchema.parse(searchParams ?? {});
}

/** Chuỗi query để mở lại đúng cài đặt: `mode=quiz&direction=en-vi&count=10&topic=all`. */
export function practiceSettingsQuery(settings: PracticeSettings): string {
  return new URLSearchParams({
    mode: settings.mode,
    direction: settings.direction,
    count: String(settings.count),
    topic: settings.topic,
  }).toString();
}

/**
 * Một câu trả lời. Đúng/sai do client chấm (đáp án đã có sẵn ở client), chỉ ảnh hưởng tiến độ
 * của chính người gửi; userId luôn lấy từ session.
 */
export const answerSchema = z.object({
  wordId: objectIdSchema,
  mode: z.enum(PRACTICE_MODES),
  direction: z.enum(DIRECTIONS),
  correct: z.boolean(),
});
