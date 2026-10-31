import "server-only";
import { getDb } from "@/server/db/client";
import { logger } from "@/server/log";

// Không cần session: chỉ trả về trạng thái kết nối, không đọc dữ liệu nào.
export async function pingDb(): Promise<boolean> {
  try {
    await getDb().command({ ping: 1 });
    return true;
  } catch (err) {
    logger.warn({ err }, "mongo ping failed");
    return false;
  }
}
