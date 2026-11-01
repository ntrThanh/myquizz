import "server-only";
import { ObjectId } from "mongodb";

export class NotFoundError extends Error {
  constructor(what = "Dữ liệu") {
    super(`${what} không tồn tại.`);
    this.name = "NotFoundError";
  }
}

/** Đổi chuỗi id từ client sang ObjectId; id sai định dạng coi như không tồn tại. */
export function toObjectId(id: string, what?: string): ObjectId {
  if (!ObjectId.isValid(id) || id.length !== 24) throw new NotFoundError(what);
  return new ObjectId(id);
}

export interface PageInput {
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function pageArgs({ page = 1, pageSize = 20 }: PageInput) {
  const size = Math.min(Math.max(Math.trunc(pageSize), 1), 100);
  const p = Math.max(Math.trunc(page), 1);
  return { page: p, pageSize: size, skip: (p - 1) * size };
}

/** Dùng chuỗi tìm kiếm của người dùng trong `$regex` mà không bị hiểu là biểu thức. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
