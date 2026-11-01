import { describe, expect, it } from "vitest";
import { QUIZ_OPTION_COUNT } from "./config";
import {
  buildQuestions,
  checkAnswer,
  modeNeedsPool,
  resolveDirection,
  type VocabEntry,
} from "./questions";

const entry = (i: number, meaningVi = `nghĩa ${i}`): VocabEntry => ({
  wordId: String(i).padStart(24, "0"),
  word: `word${i}`,
  meaningVi,
  ipa: null,
  example: null,
});

const words = Array.from({ length: 6 }, (_, i) => entry(i));

/** Bộ sinh số giả ngẫu nhiên cố định để test lặp lại được. */
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe("resolveDirection", () => {
  it("giữ nguyên chiều cố định", () => {
    expect(resolveDirection("en-vi", seeded())).toBe("en-vi");
    expect(resolveDirection("vi-en", seeded())).toBe("vi-en");
  });

  it("trộn: ra cả hai chiều", () => {
    const r = seeded(7);
    const seen = new Set(Array.from({ length: 50 }, () => resolveDirection("mixed", r)));
    expect(seen).toEqual(new Set(["en-vi", "vi-en"]));
  });
});

describe("buildQuestions: gõ đáp án", () => {
  it("Anh→Việt hỏi từ, đáp án là nghĩa", () => {
    const [q] = buildQuestions(
      [words[0]!],
      { mode: "typing", direction: "en-vi" },
      {
        pool: [],
        random: seeded(),
      },
    );
    expect(q).toMatchObject({
      mode: "typing",
      prompt: "word0",
      promptLang: "en",
      answer: "nghĩa 0",
      answerLang: "vi",
    });
  });

  it("Việt→Anh hỏi nghĩa, đáp án là từ; chấm theo từng nghĩa", () => {
    const [q] = buildQuestions(
      [entry(1, "cơm, gạo")],
      { mode: "typing", direction: "vi-en" },
      {
        pool: [],
        random: seeded(),
      },
    );
    expect(q).toMatchObject({ prompt: "cơm, gạo", answer: "word1", answerLang: "en" });
    expect(checkAnswer(q!, " WORD1 ")).toBe(true);
    expect(checkAnswer(q!, "word")).toBe(false);
  });

  it("không cần kho phương án nhiễu", () => {
    expect(modeNeedsPool("typing")).toBe(false);
  });
});

describe("buildQuestions: trắc nghiệm", () => {
  it("mỗi câu có đủ phương án khác nhau, đúng một phương án đúng", () => {
    for (const direction of ["en-vi", "vi-en", "mixed"] as const) {
      const qs = buildQuestions(
        words,
        { mode: "quiz", direction },
        { pool: words, random: seeded(3) },
      );
      expect(qs).toHaveLength(words.length);
      for (const q of qs) {
        if (q.mode !== "quiz") throw new Error("sai chế độ");
        expect(new Set(q.options).size).toBe(QUIZ_OPTION_COUNT);
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
        expect(checkAnswer(q, q.answer)).toBe(true);
        expect(
          checkAnswer(
            q,
            q.options.find((o) => o !== q.answer)!,
          ),
        ).toBe(false);
      }
    }
  });

  it("bỏ phương án nhiễu trùng nghĩa với đáp án", () => {
    const pool = [entry(0, "mẹ"), entry(1, "Mẹ"), entry(2, "a"), entry(3, "b"), entry(4, "c")];
    const [q] = buildQuestions(
      [pool[0]!],
      { mode: "quiz", direction: "en-vi" },
      {
        pool,
        random: seeded(),
      },
    );
    expect(q?.mode === "quiz" && q.options.sort()).toEqual(["a", "b", "c", "mẹ"]);
  });

  it("thiếu phương án nhiễu thì không tạo câu", () => {
    const few = words.slice(0, QUIZ_OPTION_COUNT - 1);
    expect(
      buildQuestions(few, { mode: "quiz", direction: "en-vi" }, { pool: few, random: seeded() }),
    ).toEqual([]);
    expect(modeNeedsPool("quiz")).toBe(true);
  });
});
