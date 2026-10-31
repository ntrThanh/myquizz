import { describe, expect, it } from "vitest";
import { reviewSchema } from "./schemas";

const wordId = "a".repeat(24);

describe("reviewSchema", () => {
  it("flashcard nhận 4 mức Again/Hard/Good/Easy", () => {
    for (const q of [0, 3, 4, 5])
      expect(reviewSchema.safeParse({ mode: "flashcard", wordId, q }).success).toBe(true);
    expect(reviewSchema.safeParse({ mode: "flashcard", wordId, q: 1 }).success).toBe(false);
  });

  it("quiz và gõ đáp án chỉ nhận đúng/sai", () => {
    for (const mode of ["quiz", "typing"]) {
      expect(reviewSchema.safeParse({ mode, wordId, q: 4 }).success).toBe(true);
      expect(reviewSchema.safeParse({ mode, wordId, q: 5 }).success).toBe(false);
    }
  });

  it("từ chối id sai định dạng và field thừa không đổi được kết quả", () => {
    expect(reviewSchema.safeParse({ mode: "quiz", wordId: "x", q: 4 }).success).toBe(false);
    const r = reviewSchema.parse({ mode: "quiz", wordId, q: 4, userId: "someone-else" });
    expect(r).not.toHaveProperty("userId");
  });
});
