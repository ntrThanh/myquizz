import { describe, expect, it } from "vitest";
import { addCalendarDays, calendarDayOf, startOfCalendarDay, startOfDayPlus } from "./day";

const VN = "Asia/Ho_Chi_Minh";
const NY = "America/New_York";

describe("day", () => {
  it("lấy ngày lịch theo múi giờ, không theo UTC", () => {
    // 20:00Z ngày 31/10 = 03:00 ngày 1/11 ở VN
    expect(calendarDayOf(new Date("2026-10-31T20:00:00Z"), VN)).toEqual({
      year: 2026,
      month: 11,
      day: 1,
    });
  });

  it("00:00 ở VN là 17:00Z ngày hôm trước", () => {
    expect(startOfCalendarDay({ year: 2026, month: 11, day: 1 }, VN).toISOString()).toBe(
      "2026-10-31T17:00:00.000Z",
    );
  });

  it("cộng ngày qua cuối tháng và năm nhuận", () => {
    expect(addCalendarDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
    expect(addCalendarDays({ year: 2026, month: 12, day: 31 }, 38)).toEqual({
      year: 2027,
      month: 2,
      day: 7,
    });
  });

  it("đúng khi qua ngày đổi giờ (New York hết DST ngày 1/11/2026)", () => {
    const now = new Date("2026-10-31T16:00:00Z"); // 12:00 EDT ngày 31/10
    expect(startOfDayPlus(now, 0, NY).toISOString()).toBe("2026-10-31T04:00:00.000Z"); // EDT
    expect(startOfDayPlus(now, 1, NY).toISOString()).toBe("2026-11-01T04:00:00.000Z"); // vẫn EDT lúc 00:00
    expect(startOfDayPlus(now, 6, NY).toISOString()).toBe("2026-11-06T05:00:00.000Z"); // EST
  });

  it("ném lỗi với múi giờ không hợp lệ", () => {
    expect(() => startOfDayPlus(new Date(), 1, "Mars/Olympus")).toThrow(RangeError);
  });
});
