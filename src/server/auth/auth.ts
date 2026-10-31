import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { getDb, getMongoClient } from "@/server/db/client";
import { env } from "@/server/env";

export const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

function createAuth() {
  const e = env();
  return betterAuth({
    secret: e.BETTER_AUTH_SECRET,
    baseURL: e.BETTER_AUTH_URL ?? e.APP_URL,
    database: mongodbAdapter(getDb(), { client: getMongoClient(), usePlural: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      // TODO: bật khi có nhà cung cấp email (CLAUDE.md §5.4).
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        // input: false — client không gửi được các field này khi đăng ký/cập nhật.
        role: { type: "string", defaultValue: "user", input: false },
        timeZone: { type: "string", defaultValue: DEFAULT_TIME_ZONE, input: false },
      },
    },
    advanced: {
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    // Giới hạn tần suất có sẵn của Better Auth (bộ nhớ trong; chuyển Redis ở GĐ 3).
    rateLimit: { enabled: e.NODE_ENV === "production", window: 60, max: 30 },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

// Khởi tạo lười để `next build` không cần biến môi trường hay kết nối DB.
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
