import "server-only";
import { z } from "zod";

// Thêm biến vào đây khi tính năng cần tới.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url(),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET cần ít nhất 32 ký tự"),
  // Chuỗi rỗng (dòng `KEY=` trong .env) coi như không đặt.
  BETTER_AUTH_URL: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

// Parse lười để `next build` không đòi biến môi trường lúc chạy.
export function env(): Env {
  if (!cached) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      // Chỉ in tên biến lỗi, không in giá trị.
      throw new Error(`Biến môi trường không hợp lệ:\n${z.prettifyError(result.error)}`);
    }
    cached = result.data;
  }
  return cached;
}
