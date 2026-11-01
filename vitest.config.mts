import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` ném lỗi ngoài React Server; trong test thay bằng module rỗng.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "migrations/**/*.test.ts", "scripts/**/*.test.ts"],
    setupFiles: ["test/setup-env.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
