import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-redirect";

describe("safeNext", () => {
  it("giữ đường dẫn nội bộ", () => {
    expect(safeNext("/learn/review")).toBe("/learn/review");
  });
  it("chặn URL ngoài và đường dẫn protocol-relative", () => {
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "",
      null,
      undefined,
    ]) {
      expect(safeNext(bad)).toBe("/learn");
    }
  });
});
