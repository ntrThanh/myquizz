import "server-only";
import { assertRole, ForbiddenError, type Actor } from "@/server/auth/roles";
import { getMongoClient } from "@/server/db/client";
import { collections, type Role } from "@/server/db/collections";
import { recordAudit } from "@/server/dal/audit";
import {
  escapeRegex,
  NotFoundError,
  pageArgs,
  toObjectId,
  type Page,
  type PageInput,
} from "@/server/dal/common";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export async function listUsers(
  actor: Actor | null,
  input: PageInput & { query?: string } = {},
): Promise<Page<UserRow>> {
  assertRole(actor, "admin");
  const { page, pageSize, skip } = pageArgs(input);
  const q = input.query?.trim();
  const filter = q
    ? {
        $or: [
          { email: { $regex: escapeRegex(q), $options: "i" } },
          { name: { $regex: escapeRegex(q), $options: "i" } },
        ],
      }
    : {};
  const [docs, total] = await Promise.all([
    collections.users().find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    collections.users().countDocuments(filter),
  ]);
  return {
    items: docs.map((u) => ({
      id: u._id.toHexString(),
      name: u.name,
      email: u.email,
      role: u.role ?? "user",
      createdAt: u.createdAt,
    })),
    page,
    pageSize,
    total,
  };
}

/** Chỉ admin; không ai tự đổi role của chính mình. Ghi audit trong cùng transaction. */
export async function setUserRole(actor: Actor | null, userId: string, role: Role): Promise<void> {
  assertRole(actor, "admin");
  if (userId === actor.id) throw new ForbiddenError();
  const _id = toObjectId(userId, "Người dùng");

  const session = getMongoClient().startSession();
  try {
    await session.withTransaction(async () => {
      const user = await collections.users().findOne({ _id }, { session });
      if (!user) throw new NotFoundError("Người dùng");
      if (user.role === role) return;
      await collections
        .users()
        .updateOne({ _id }, { $set: { role, updatedAt: new Date() } }, { session });
      await recordAudit(
        actor,
        "user.setRole",
        { type: "user", id: userId },
        { from: user.role ?? "user", to: role },
        session,
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function countUsers(actor: Actor | null): Promise<number> {
  assertRole(actor, "admin");
  return collections.users().countDocuments();
}
