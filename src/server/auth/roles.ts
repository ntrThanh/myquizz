import "server-only";
import type { Role } from "@/lib/types";

/** Người dùng đã đăng nhập, lấy từ session (không bao giờ từ input của client). */
export interface Actor {
  id: string;
  name: string;
  email: string;
  role: Role;
  timeZone: string;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Bạn cần đăng nhập.");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Bạn không có quyền thực hiện thao tác này.");
    this.name = "ForbiddenError";
  }
}

const RANK: Record<Role, number> = { user: 0, editor: 1, admin: 2 };

export function hasRole(actor: Actor | null, min: Role): boolean {
  return !!actor && RANK[actor.role] >= RANK[min];
}

export function assertUser(actor: Actor | null): asserts actor is Actor {
  if (!actor) throw new UnauthorizedError();
}

export function assertRole(actor: Actor | null, min: Role): asserts actor is Actor {
  assertUser(actor);
  if (!hasRole(actor, min)) throw new ForbiddenError();
}
