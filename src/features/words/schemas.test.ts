import { describe, expect, it } from "vitest";
import { updateWordSchema, WORD_LIMITS, wordInputSchema } from "./schemas";

const valid = { word: " cat ", meaningVi: "con mèo", status: "published" };

describe("wordInputSchema", () => {
  it("cắt khoảng trắng, field tùy chọn mặc định rỗng", () => {
    expect(wordInputSchema.parse(valid)).toEqual({
      word: "cat",
      meaningVi: "con mèo",
      ipa: "",
      example: "",
      status: "published",
    });
  });

  it("bắt buộc có từ và nghĩa (không tính khoảng trắng)", () => {
    expect(wordInputSchema.safeParse({ ...valid, word: "   " }).success).toBe(false);
    expect(wordInputSchema.safeParse({ ...valid, meaningVi: "" }).success).toBe(false);
  });

  it("giới hạn độ dài và trạng thái", () => {
    const long = "a".repeat(WORD_LIMITS.word + 1);
    expect(wordInputSchema.safeParse({ ...valid, word: long }).success).toBe(false);
    expect(wordInputSchema.safeParse({ ...valid, status: "archived" }).success).toBe(false);
  });

  it("sửa từ cần id hợp lệ", () => {
    expect(updateWordSchema.safeParse({ ...valid, id: "x" }).success).toBe(false);
    expect(updateWordSchema.safeParse({ ...valid, id: "a".repeat(24) }).success).toBe(true);
  });
});
