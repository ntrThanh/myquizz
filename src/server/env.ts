import "server-only";
import { z } from "zod";

// Chỉ biến môi trường của Giai đoạn 0; thêm dần khi tính năng cần.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url(),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1),
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
