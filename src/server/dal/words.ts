import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { assertRole, type Actor } from "@/server/auth/roles";
import { getMongoClient } from "@/server/db/client";
import { collections, type ContentStatus, type WordDoc } from "@/server/db/collections";
import { recordAudit } from "@/server/dal/audit";
import {
  escapeRegex,
  NotFoundError,
  pageArgs,
  toObjectId,
  type Page,
  type PageInput,
} from "@/server/dal/common";

// Quản lý từ vựng: chỉ editor/admin. Không có xóa cứng; ẩn từ bằng cách chuyển về draft để không
// làm mất tiến độ học của người dùng.

export interface WordInput {
  word: string;
  meaningVi: string;
  ipa: string;
  example: string;
  status: ContentStatus;
}

export interface WordRow extends WordInput {
  id: string;
  updatedAt: Date;
}

function toRow(w: WordDoc): WordRow {
  return {
    id: w._id.toHexString(),
    word: w.word,
    meaningVi: w.meaningVi,
    ipa: w.ipa ?? "",
    example: w.example ?? "",
    status: w.status,
    updatedAt: w.updatedAt,
  };
}

const OPTIONAL_FIELDS = ["ipa", "example"] as const;

/** Field tùy chọn để trống thì không lưu (thay vì lưu chuỗi rỗng). */
function toFields(input: WordInput) {
  const set: Pick<WordDoc, "word" | "meaningVi" | "status" | "ipa" | "example"> = {
    word: input.word,
    meaningVi: input.meaningVi,
    status: input.status,
  };
  const unset: Partial<Record<(typeof OPTIONAL_FIELDS)[number], "">> = {};
  for (const key of OPTIONAL_FIELDS) {
    if (input[key]) set[key] = input[key];
    else unset[key] = "";
  }
  return { set, unset };
}

export async function listWords(
  actor: Actor | null,
  input: PageInput & { query?: string; status?: ContentStatus } = {},
): Promise<Page<WordRow>> {
  assertRole(actor, "editor");
  const { page, pageSize, skip } = pageArgs(input);
  const q = input.query?.trim();
  const filter: Filter<WordDoc> = {
    ...(input.status ? { status: input.status } : {}),
    ...(q
      ? {
          $or: [
            { word: { $regex: escapeRegex(q), $options: "i" } },
            { meaningVi: { $regex: escapeRegex(q), $options: "i" } },
          ],
        }
      : {}),
  };
  const [docs, total] = await Promise.all([
    collections
      .words()
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    collections.words().countDocuments(filter),
  ]);
  return { items: docs.map(toRow), page, pageSize, total };
}

export async function getWord(actor: Actor | null, id: string): Promise<WordRow> {
  assertRole(actor, "editor");
  const word = await collections.words().findOne({ _id: toObjectId(id, "Từ") });
  if (!word) throw new NotFoundError("Từ");
  return toRow(word);
}

export async function countWords(actor: Actor | null): Promise<number> {
  assertRole(actor, "editor");
  return collections.words().countDocuments();
}

/** Tạo từ mới và ghi audit trong cùng transaction. */
export async function createWord(actor: Actor | null, input: WordInput): Promise<{ id: string }> {
  assertRole(actor, "editor");
  const now = new Date();
  const _id = new ObjectId();
  const { set } = toFields(input);

  const session = getMongoClient().startSession();
  try {
    await session.withTransaction(async () => {
      await collections
        .words()
        .insertOne({ ...set, _id, createdAt: now, updatedAt: now }, { session });
      await recordAudit(
        actor,
        "word.create",
        { type: "word", id: _id.toHexString() },
        { word: input.word, status: input.status },
        session,
      );
    });
  } finally {
    await session.endSession();
  }
  return { id: _id.toHexString() };
}

/** Sửa từ; audit ghi lại những field đã đổi. Không đổi gì thì không ghi. */
export async function updateWord(actor: Actor | null, id: string, input: WordInput): Promise<void> {
  assertRole(actor, "editor");
  const _id = toObjectId(id, "Từ");
  const { set, unset } = toFields(input);

  const session = getMongoClient().startSession();
  try {
    await session.withTransaction(async () => {
      const current = await collections.words().findOne({ _id }, { session });
      if (!current) throw new NotFoundError("Từ");
      const before = toRow(current);
      const changed = (Object.keys(input) as (keyof WordInput)[]).filter(
        (k) => before[k] !== input[k],
      );
      if (changed.length === 0) return;

      await collections.words().updateOne(
        { _id },
        {
          $set: { ...set, updatedAt: new Date() },
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
        { session },
      );
      await recordAudit(actor, "word.update", { type: "word", id }, { changed }, session);
    });
  } finally {
    await session.endSession();
  }
}
