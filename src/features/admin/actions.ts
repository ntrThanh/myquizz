"use server";

import { revalidatePath } from "next/cache";
import { actionError, invalidInput, type ActionResult } from "@/server/action-result";
import { getActor } from "@/server/auth/session";
import { setUserRole } from "@/server/dal/users";
import { setRoleSchema } from "@/features/admin/schemas";

export async function setRoleAction(input: unknown): Promise<ActionResult> {
  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  try {
    // setUserRole kiểm tra quyền admin, chặn tự đổi role và ghi audit log.
    await setUserRole(await getActor(), parsed.data.userId, parsed.data.role);
    revalidatePath("/admin/users");
    revalidatePath("/admin/audit");
    return { ok: true, data: undefined };
  } catch (err) {
    return actionError(err);
  }
}
