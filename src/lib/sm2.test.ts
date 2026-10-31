import { describe, expect, it } from "vitest";
import {
  GRADES,
  INITIAL_SM2,
  MIN_EF,
  nextEf,
  qualityFromAnswer,
  review,
  type Quality,
  type Sm2State,
} from "./sm2";

const opts = { now: new Date("2026-10-31T03:00:00Z"), timeZone: "Asia/Ho_Chi_Minh" };

function reviewMany(qs: Quality[], start: Sm2State = INITIAL_SM2) {
  const out = [];
  let s = start;
  for (const q of qs) {
    const r = review(s, q, opts);
    out.push(r);
    s = r;
  }
  return out;
}

describe("SM-2", () => {
  it("chuỗi Good cho interval 1, 6, 15, 38 và ef giữ 2.5", () => {
    const rs = reviewMany([4, 4, 4, 4]);
    expect(rs.map((r) => r.interval)).toEqual([1, 6, 15, 38]);
    expect(rs.map((r) => r.n)).toEqual([1, 2, 3, 4]);
    expect(rs.every((r) => r.ef === 2.5)).toBe(true);
  });

  it("Easy đưa ef lên 2.6", () => {
    expect(review(INITIAL_SM2, GRADES.easy, opts).ef).toBe(2.6);
  });

  it("Hard đưa ef xuống 2.36", () => {
    expect(review(INITIAL_SM2, GRADES.hard, opts).ef).toBe(2.36);
  });

  it("Again reset n về 0 và interval về 1", () => {
    const [, , , again] = reviewMany([4, 4, 4, 0]);
    expect(again).toMatchObject({ n: 0, interval: 1 });
  });

  it("Again vẫn cập nhật ef (giảm 0.8)", () => {
    expect(review(INITIAL_SM2, GRADES.again, opts).ef).toBe(1.7);
  });

  it("ef không bao giờ dưới 1.3", () => {
    const rs = reviewMany([0, 0, 0, 0, 0, 1, 2]);
    expect(rs.at(-1)!.ef).toBe(MIN_EF);
    expect(rs.every((r) => r.ef >= MIN_EF)).toBe(true);
    expect(nextEf(1.3, 0)).toBe(MIN_EF);
  });

  it("sau khi quên, học lại đi 1 → 6 → interval × ef", () => {
    const rs = reviewMany([4, 4, 4, 0, 4, 4, 4]);
    // ef: 2.5 → Again 1.7 → giữ nguyên khi Good
    expect(rs.slice(4).map((r) => r.interval)).toEqual([1, 6, 10]);
  });

  it("ef không bị sai số float sau nhiều lượt", () => {
    const rs = reviewMany([3, 5, 3, 5, 3, 5, 3, 5]);
    for (const r of rs) expect(Math.round(r.ef * 100) / 100).toBe(r.ef);
  });

  it("từ chối điểm ngoài 0-5", () => {
    expect(() => review(INITIAL_SM2, 6 as Quality, opts)).toThrow(RangeError);
    expect(() => review(INITIAL_SM2, 2.5 as Quality, opts)).toThrow(RangeError);
  });

  it("dueDate là 00:00 giờ Việt Nam của ngày đến hạn, lưu UTC", () => {
    // 03:00Z = 10:00 ngày 31/10 ở VN; +1 ngày → 00:00 ngày 1/11 VN = 17:00Z ngày 31/10
    expect(review(INITIAL_SM2, GRADES.good, opts).dueDate.toISOString()).toBe(
      "2026-10-31T17:00:00.000Z",
    );
  });

  it("đáp án quiz: đúng = Good, sai = Again", () => {
    expect(qualityFromAnswer(true)).toBe(4);
    expect(qualityFromAnswer(false)).toBe(0);
  });
});
