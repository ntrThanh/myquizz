"use server";

import { revalidatePath } from "next/cache";
import { actionError, invalidInput, type ActionResult } from "@/server/action-result";
import { getActor } from "@/server/auth/session";
import { recordReview, startLesson } from "@/server/dal/study";
import { reviewSchema, startLessonSchema } from "@/features/study/schemas";

export async function startLessonAction(input: unknown): Promise<ActionResult<{ added: number }>> {
  const parsed = startLessonSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  try {
    const data = await startLesson(await getActor(), parsed.data.lessonId);
    revalidatePath(`/courses/${parsed.data.courseSlug}`);
    return { ok: true, data };
  } catch (err) {
    return actionError(err);
  }
}

export async function submitReviewAction(
  input: unknown,
): Promise<ActionResult<{ interval: number }>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  try {
    const { interval } = await recordReview(await getActor(), parsed.data);
    return { ok: true, data: { interval } };
  } catch (err) {
    return actionError(err);
  }
}
