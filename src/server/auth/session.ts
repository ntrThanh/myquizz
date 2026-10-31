import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROLES, type Role } from "@/lib/types";
import { getAuth } from "@/server/auth/auth";
import { hasRole, type Actor } from "@/server/auth/roles";

/** Người đang đăng nhập (đọc session từ cookie), hoặc null. Gọi nhiều lần trong một request chỉ tốn một lần. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user;
  const role = ROLES.includes(u.role as Role) ? (u.role as Role) : "user";
  return { id: u.id, name: u.name, email: u.email, role, timeZone: u.timeZone };
});

/** Dùng trong page/layout: chưa đăng nhập thì chuyển tới trang đăng nhập. */
export async function requireActor(next?: string): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return actor;
}

/** Dùng trong page/layout: thiếu quyền thì về trang chủ. */
export async function requireActorRole(min: Role, next?: string): Promise<Actor> {
  const actor = await requireActor(next);
  if (!hasRole(actor, min)) redirect("/");
  return actor;
}
