import { notFound } from "next/navigation";
import { NotFoundError } from "@/server/dal/common";

/** Dùng trong `.catch()`: lỗi NotFound của DAL thành trang 404, lỗi khác ném tiếp. */
export function notFoundOn(err: unknown): never {
  if (err instanceof NotFoundError) notFound();
  throw err;
}
