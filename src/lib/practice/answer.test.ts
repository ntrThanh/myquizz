import { describe, expect, it } from "vitest";
import { acceptedAnswers, isCorrectAnswer, normalizeAnswer } from "./answer";

describe("normalizeAnswer", () => {
  it("bỏ hoa thường và khoảng trắng thừa", () => {
    expect(normalizeAnswer("  Ice   Cream ")).toBe("ice cream");
    expect(normalizeAnswer("Apple")).not.toBe(normalizeAnswer("apples"));
  });

  it("chữ có dấu dựng sẵn và tổ hợp được coi là một", () => {
    expect(normalizeAnswer("mẹ")).toBe(normalizeAnswer("mẹ"));
  });
});

describe("acceptedAnswers", () => {
  it("nhận cả chuỗi và từng nghĩa tách bằng dấu phẩy/chấm phẩy", () => {
    expect(acceptedAnswers("cơm, gạo")).toEqual(["cơm, gạo", "cơm", "gạo"]);
    expect(acceptedAnswers("a; b")).toEqual(["a; b", "a", "b"]);
  });

  it("không tách dấu gạch chéo (một nghĩa có thể chứa nó)", () => {
    expect(acceptedAnswers("chị/em gái")).toEqual(["chị/em gái"]);
  });
});

describe("isCorrectAnswer", () => {
  it("đúng khi khớp một nghĩa bất kỳ", () => {
    expect(isCorrectAnswer("Gạo", "cơm, gạo")).toBe(true);
    expect(isCorrectAnswer("cơm, gạo", "cơm, gạo")).toBe(true);
    expect(isCorrectAnswer("com", "cơm, gạo")).toBe(false);
  });

  it("chuỗi rỗng luôn sai", () => {
    expect(isCorrectAnswer("   ", "a,")).toBe(false);
  });
});
