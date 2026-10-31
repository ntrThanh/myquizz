import "server-only";
import { getMessages } from "@/lib/i18n";
import { ForbiddenError, UnauthorizedError } from "@/server/auth/roles";
import { NotFoundError } from "@/server/dal/common";
import { logger } from "@/server/log";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/** Đổi lỗi thành thông báo cho người dùng; lỗi không lường trước thì log lại, không lộ chi tiết. */
export function actionError(err: unknown): { ok: false; error: string } {
  const t = getMessages().errors;
  if (err instanceof UnauthorizedError) return { ok: false, error: t.unauthorized };
  if (err instanceof ForbiddenError) return { ok: false, error: t.forbidden };
  if (err instanceof NotFoundError) return { ok: false, error: err.message };
  logger.error({ err }, "server action failed");
  return { ok: false, error: t.unknown };
}

export function invalidInput(): { ok: false; error: string } {
  return { ok: false, error: getMessages().errors.invalid };
}
