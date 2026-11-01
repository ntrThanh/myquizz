import { describe, expect, it } from "vitest";
import { DEFAULT_PRACTICE_SETTINGS } from "@/lib/practice/config";
import { answerSchema, parsePracticeSettings, practiceSettingsQuery } from "./schemas";

const wordId = "a".repeat(24);

describe("parsePracticeSettings", () => {
  it("đọc cài đặt hợp lệ từ searchParams", () => {
    expect(
      parsePracticeSettings({ mode: "typing", direction: "mixed", count: "20", topic: "medicine" }),
    ).toEqual({ mode: "typing", direction: "mixed", count: 20, topic: "medicine" });
  });

  it("giá trị thiếu hoặc sai thì dùng mặc định", () => {
    expect(parsePracticeSettings({})).toEqual(DEFAULT_PRACTICE_SETTINGS);
    expect(parsePracticeSettings(undefined)).toEqual(DEFAULT_PRACTICE_SETTINGS);
    expect(
      parsePracticeSettings({ mode: "flashcard", direction: "fr-vi", count: "999", topic: "food" }),
    ).toEqual(DEFAULT_PRACTICE_SETTINGS);
  });

  it("tham số lặp lại thì lấy giá trị đầu", () => {
    expect(parsePracticeSettings({ mode: ["typing", "quiz"] }).mode).toBe("typing");
  });

  it("query tạo ra đọc lại được đúng cài đặt", () => {
    const s = { mode: "typing", direction: "vi-en", count: 30, topic: "law" } as const;
    const query = Object.fromEntries(new URLSearchParams(practiceSettingsQuery(s)));
    expect(parsePracticeSettings(query)).toEqual(s);
  });
});

describe("answerSchema", () => {
  it("nhận câu trả lời hợp lệ", () => {
    expect(
      answerSchema.safeParse({ wordId, mode: "quiz", direction: "en-vi", correct: true }).success,
    ).toBe(true);
  });

  it("từ chối chế độ, chiều hỏi hoặc id sai", () => {
    const ok = { wordId, mode: "typing", direction: "vi-en", correct: false };
    expect(answerSchema.safeParse({ ...ok, mode: "flashcard" }).success).toBe(false);
    expect(answerSchema.safeParse({ ...ok, direction: "mixed" }).success).toBe(false);
    expect(answerSchema.safeParse({ ...ok, wordId: "x" }).success).toBe(false);
    expect(answerSchema.safeParse({ ...ok, correct: "yes" }).success).toBe(false);
  });

  it("field thừa (userId) bị bỏ đi", () => {
    const r = answerSchema.parse({
      wordId,
      mode: "quiz",
      direction: "en-vi",
      correct: true,
      userId: "someone-else",
    });
    expect(r).not.toHaveProperty("userId");
  });
});
