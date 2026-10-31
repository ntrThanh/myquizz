import { describe, expect, it } from "vitest";
import { computeStreak, normalizeAnswer, retentionRate } from "./stats";

const VN = "Asia/Ho_Chi_Minh";
const now = new Date("2026-10-31T05:00:00Z"); // 12:00 ngày 31/10 ở VN

describe("computeStreak", () => {
  it("0 khi chưa ôn ngày nào", () => {
    expect(computeStreak([], now, VN)).toBe(0);
  });

  it("đếm các ngày liên tiếp tới hôm nay", () => {
    expect(computeStreak(["2026-10-29", "2026-10-30", "2026-10-31"], now, VN)).toBe(3);
  });

  it("hôm nay chưa ôn thì vẫn giữ chuỗi tới hôm qua", () => {
    expect(computeStreak(["2026-10-29", "2026-10-30"], now, VN)).toBe(2);
  });

  it("đứt chuỗi khi bỏ một ngày", () => {
    expect(computeStreak(["2026-10-27", "2026-10-28", "2026-10-30", "2026-10-31"], now, VN)).toBe(
      2,
    );
    expect(computeStreak(["2026-10-28", "2026-10-29"], now, VN)).toBe(0);
  });

  it("dùng ngày theo múi giờ người dùng", () => {
    // 20:00Z ngày 31/10 đã là ngày 1/11 ở VN
    expect(computeStreak(["2026-11-01"], new Date("2026-10-31T20:00:00Z"), VN)).toBe(1);
  });
});

describe("retentionRate", () => {
  it("chia đúng trên tổng", () => {
    expect(retentionRate(3, 4)).toBe(0.75);
  });
  it("null khi chưa có lượt ôn", () => {
    expect(retentionRate(0, 0)).toBeNull();
  });
});

describe("normalizeAnswer", () => {
  it("bỏ hoa thường và khoảng trắng thừa", () => {
    expect(normalizeAnswer("  Ice   Cream ")).toBe(normalizeAnswer("ice cream"));
    expect(normalizeAnswer("Apple")).not.toBe(normalizeAnswer("apples"));
  });
});
