"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { actionError, invalidInput, type ActionResult } from "@/server/action-result";
import { getActor } from "@/server/auth/session";
import { createWord, setWordsStatus, updateWord } from "@/server/dal/words";
import { updateWordSchema, wordInputSchema, wordsStatusSchema } from "@/features/words/schemas";

// Các hàm DAL tự kiểm tra quyền editor và ghi audit log.

function revalidateWords() {
  revalidatePath(routes.adminWords);
  revalidatePath(routes.admin);
}

export async function createWordAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = wordInputSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  try {
    const data = await createWord(await getActor(), parsed.data);
    revalidateWords();
    return { ok: true, data };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateWordAction(input: unknown): Promise<ActionResult> {
  const parsed = updateWordSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const { id, ...fields } = parsed.data;
  try {
    await updateWord(await getActor(), id, fields);
    revalidateWords();
    return { ok: true, data: undefined };
  } catch (err) {
    return actionError(err);
  }
}

export async function setWordsStatusAction(
  input: unknown,
): Promise<ActionResult<{ changed: number }>> {
  const parsed = wordsStatusSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  try {
    const data = await setWordsStatus(await getActor(), parsed.data.ids, parsed.data.status);
    revalidateWords();
    return { ok: true, data };
  } catch (err) {
    return actionError(err);
  }
}
