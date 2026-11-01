"use server";

import { actionError, invalidInput, type ActionResult } from "@/server/action-result";
import { getActor } from "@/server/auth/session";
import { recordAnswer } from "@/server/dal/practice";
import { answerSchema } from "@/features/practice/schemas";

export async function recordAnswerAction(input: unknown): Promise<ActionResult> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  try {
    await recordAnswer(await getActor(), parsed.data);
    return { ok: true, data: undefined };
  } catch (err) {
    return actionError(err);
  }
}
