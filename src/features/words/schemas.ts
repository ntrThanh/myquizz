import { z } from "zod";
import { MAX_TOPICS_PER_WORD, TOPICS } from "@/lib/topics";
import { CONTENT_STATUSES } from "@/lib/types";
import { MAX_BULK_WORDS } from "@/lib/words";
import { objectIdSchema } from "@/lib/validation";

/** Độ dài tối đa từng field; form dùng chung để đặt `maxLength`. */
export const WORD_LIMITS = { word: 100, meaningVi: 300, ipa: 100, example: 500 } as const;

const text = (max: number) => z.string().trim().max(max);

export const wordInputSchema = z.object({
  word: text(WORD_LIMITS.word).min(1),
  meaningVi: text(WORD_LIMITS.meaningVi).min(1),
  ipa: text(WORD_LIMITS.ipa).default(""),
  example: text(WORD_LIMITS.example).default(""),
  // Bỏ trùng và sắp theo thứ tự trong TOPICS để so sánh/hiển thị ổn định.
  topics: z
    .array(z.enum(TOPICS))
    .min(1)
    .max(MAX_TOPICS_PER_WORD)
    .transform((list) => TOPICS.filter((t) => list.includes(t))),
  status: z.enum(CONTENT_STATUSES),
});

export type WordValues = z.output<typeof wordInputSchema>;

export const updateWordSchema = wordInputSchema.extend({ id: objectIdSchema });

export const wordsStatusSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(MAX_BULK_WORDS),
  status: z.enum(CONTENT_STATUSES),
});
