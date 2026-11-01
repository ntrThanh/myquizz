import { describe, expect, it } from "vitest";
import { LIFE_TOPICS } from "../src/lib/topics";
import { TOPIC_WORDS } from "./topic-words";

/** Mỗi chủ đề đời sống cần đủ từ cho nhiều bài (mỗi bài LESSON_SIZE từ). */
const MIN_WORDS = 300;

describe("TOPIC_WORDS", () => {
  for (const topic of LIFE_TOPICS) {
    it(`${topic}: ít nhất ${MIN_WORDS} từ, không trùng, viết thường`, () => {
      const words = TOPIC_WORDS[topic];
      const dupes = words.filter((w, i) => words.indexOf(w) !== i);
      expect(dupes).toEqual([]);
      expect(words.filter((w) => w !== w.toLowerCase())).toEqual([]);
      expect(words.length).toBeGreaterThanOrEqual(MIN_WORDS);
    });
  }
});
