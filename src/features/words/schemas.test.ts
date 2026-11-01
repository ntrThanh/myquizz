import { describe, expect, it } from "vitest";
import { updateWordSchema, WORD_LIMITS, wordInputSchema, wordsStatusSchema } from "./schemas";

const valid = { word: " cat ", meaningVi: "con mèo", topic: "general", status: "published" };

describe("wordInputSchema", () => {
  it("cắt khoảng trắng, field tùy chọn mặc định rỗng", () => {
    expect(wordInputSchema.parse(valid)).toEqual({
      word: "cat",
      meaningVi: "con mèo",
      ipa: "",
      example: "",
      topic: "general",
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
    expect(wordInputSchema.safeParse({ ...valid, topic: "food" }).success).toBe(false);
  });

  it("sửa từ cần id hợp lệ", () => {
    expect(updateWordSchema.safeParse({ ...valid, id: "x" }).success).toBe(false);
    expect(updateWordSchema.safeParse({ ...valid, id: "a".repeat(24) }).success).toBe(true);
  });
});

describe("wordsStatusSchema", () => {
  const id = "a".repeat(24);
  it("nhận danh sách id hợp lệ, từ 1 đến 100 id", () => {
    expect(wordsStatusSchema.safeParse({ ids: [id], status: "published" }).success).toBe(true);
    expect(wordsStatusSchema.safeParse({ ids: [], status: "published" }).success).toBe(false);
    const tooMany = Array.from({ length: 101 }, () => id);
    expect(wordsStatusSchema.safeParse({ ids: tooMany, status: "draft" }).success).toBe(false);
  });

  it("từ chối id hoặc trạng thái sai", () => {
    expect(wordsStatusSchema.safeParse({ ids: ["x"], status: "draft" }).success).toBe(false);
    expect(wordsStatusSchema.safeParse({ ids: [id], status: "archived" }).success).toBe(false);
  });
});
