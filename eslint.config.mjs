import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Chỉ DAL được chạm MongoDB (CLAUDE.md §5.1).
    files: ["src/**/*.{ts,tsx}"],
    // auth.ts: adapter của Better Auth cần DB client để quản lý users/sessions.
    ignores: ["src/server/dal/**", "src/server/db/**", "src/server/auth/auth.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "mongodb", message: "Chỉ src/server/dal/ được gọi MongoDB." }],
          patterns: [
            {
              group: ["@/server/db", "@/server/db/*"],
              message: "Chỉ src/server/dal/ được gọi MongoDB.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "dist/**", "next-env.d.ts"]),
]);

export default eslintConfig;
