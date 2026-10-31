import "server-only";
import { ObjectId, type ClientSession, type Document } from "mongodb";
import { assertRole, type Actor } from "@/server/auth/roles";
import { collections } from "@/server/db/collections";
import { pageArgs, type Page, type PageInput } from "@/server/dal/common";

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  target: { type: string; id: string };
  meta: Document | null;
  createdAt: Date;
}

/** Chỉ gọi từ các hàm DAL khác, sau khi chúng đã kiểm tra quyền. */
export async function recordAudit(
  actor: Actor,
  action: string,
  target: { type: string; id: string },
  meta?: Document,
  session?: ClientSession,
) {
  await collections.auditLogs().insertOne(
    {
      _id: new ObjectId(),
      actorId: new ObjectId(actor.id),
      action,
      target,
      ...(meta ? { meta } : {}),
      createdAt: new Date(),
    },
    { session },
  );
}

export async function listAuditLogs(
  actor: Actor | null,
  input: PageInput = {},
): Promise<Page<AuditEntry>> {
  assertRole(actor, "admin");
  const { page, pageSize, skip } = pageArgs(input);
  const [docs, total] = await Promise.all([
    collections.auditLogs().find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    collections.auditLogs().countDocuments(),
  ]);
  const actorIds = [...new Set(docs.flatMap((d) => (d.actorId ? [d.actorId.toHexString()] : [])))];
  const users = await collections
    .users()
    .find({ _id: { $in: actorIds.map((id) => new ObjectId(id)) } }, { projection: { email: 1 } })
    .toArray();
  const emailById = new Map(users.map((u) => [u._id.toHexString(), u.email]));
  return {
    items: docs.map((d) => ({
      id: d._id.toHexString(),
      actorEmail: d.actorId ? (emailById.get(d.actorId.toHexString()) ?? "(đã xóa)") : null,
      action: d.action,
      target: d.target,
      meta: d.meta ?? null,
      createdAt: d.createdAt,
    })),
    page,
    pageSize,
    total,
  };
}
