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
    ignores: ["src/server/dal/**", "src/server/db/**"],
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
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
