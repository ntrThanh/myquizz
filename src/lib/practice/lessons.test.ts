import { describe, expect, it } from "vitest";
import { countPerLesson, lessonCount, lessonSlice } from "./lessons";

const items = Array.from({ length: 7 }, (_, i) => i);

describe("lessons", () => {
  it("số bài làm tròn lên, bài cuối có thể ít hơn", () => {
    expect(lessonCount(0, 3)).toBe(0);
    expect(lessonCount(6, 3)).toBe(2);
    expect(lessonCount(7, 3)).toBe(3);
    expect(lessonSlice(items, 3, 3)).toEqual([6]);
  });

  it("bài đánh số từ 1; số bài sai hoặc vượt quá thì rỗng", () => {
    expect(lessonSlice(items, 1, 3)).toEqual([0, 1, 2]);
    expect(lessonSlice(items, 0, 3)).toEqual([]);
    expect(lessonSlice(items, 1.5, 3)).toEqual([]);
    expect(lessonSlice(items, 4, 3)).toEqual([]);
  });

  it("thêm phần tử vào cuối không làm đổi các bài trước", () => {
    expect(lessonSlice([...items, 7, 8], 2, 3)).toEqual(lessonSlice(items, 2, 3));
  });

  it("đếm theo từng bài", () => {
    expect(countPerLesson(items, (n) => n % 2 === 0, 3)).toEqual([
      { total: 3, matched: 2 },
      { total: 3, matched: 1 },
      { total: 1, matched: 1 },
    ]);
  });
});
