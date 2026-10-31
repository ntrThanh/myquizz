import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/);

export const startLessonSchema = z.object({ lessonId: objectId, courseSlug: z.string().max(200) });

// Flashcard tự chấm bằng 4 nút; quiz và gõ đáp án chỉ có đúng (Good) / sai (Again).
export const reviewSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("flashcard"),
    wordId: objectId,
    q: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
  }),
  z.object({ mode: z.literal("quiz"), wordId: objectId, q: z.union([z.literal(0), z.literal(4)]) }),
  z.object({
    mode: z.literal("typing"),
    wordId: objectId,
    q: z.union([z.literal(0), z.literal(4)]),
  }),
]);

export type ReviewInput = z.infer<typeof reviewSchema>;
