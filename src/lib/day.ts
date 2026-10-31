// Tính theo "ngày lịch" ở múi giờ của người dùng; kết quả luôn là Date (UTC) để lưu DB.
// Dùng Intl nên chạy được cả server lẫn trình duyệt, không cần thư viện.

export interface CalendarDay {
  year: number;
  month: number; // 1-12
  day: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    // Ném RangeError nếu timeZone không hợp lệ.
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

function wallClock(date: Date, timeZone: string) {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
}

/** Độ lệch (ms) của múi giờ so với UTC tại thời điểm `date`. */
function offsetMs(date: Date, timeZone: string): number {
  const w = wallClock(date, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Ngày lịch của `date` khi nhìn ở múi giờ `timeZone`. */
export function calendarDayOf(date: Date, timeZone: string): CalendarDay {
  const { year, month, day } = wallClock(date, timeZone);
  return { year, month, day };
}

/** Thời điểm 00:00 của ngày lịch `d` ở múi giờ `timeZone`, dạng UTC. */
export function startOfCalendarDay(d: CalendarDay, timeZone: string): Date {
  const guess = Date.UTC(d.year, d.month - 1, d.day);
  // Lặp hai lần để đúng cả khi ngày đó đổi giờ (DST).
  let result = guess - offsetMs(new Date(guess), timeZone);
  result = guess - offsetMs(new Date(result), timeZone);
  return new Date(result);
}

/** Cộng `days` ngày lịch (không phải 24h × days, để không lệch khi đổi giờ). */
export function addCalendarDays(d: CalendarDay, days: number): CalendarDay {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

/** 00:00 hôm nay (theo `timeZone`) cộng thêm `days` ngày, dạng UTC. */
export function startOfDayPlus(now: Date, days: number, timeZone: string): Date {
  return startOfCalendarDay(addCalendarDays(calendarDayOf(now, timeZone), days), timeZone);
}
