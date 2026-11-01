import { addCalendarDays, calendarDayOf, type CalendarDay } from "@/lib/day";

/** "YYYY-MM-DD" — cùng định dạng với `$dateToString: "%Y-%m-%d"` của MongoDB. */
export function dayKey(d: CalendarDay): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/**
 * Số ngày liên tiếp có ít nhất một lượt ôn, tính lùi từ hôm nay.
 * Hôm nay chưa ôn thì vẫn giữ chuỗi nếu hôm qua có ôn (người dùng còn cả ngày để ôn tiếp).
 */
export function computeStreak(reviewDays: Iterable<string>, now: Date, timeZone: string): number {
  const days = new Set(reviewDays);
  let cursor = calendarDayOf(now, timeZone);
  if (!days.has(dayKey(cursor))) cursor = addCalendarDays(cursor, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addCalendarDays(cursor, -1);
  }
  return streak;
}

/** Tỉ lệ nhớ đúng (q >= 3) trên tổng lượt ôn; null khi chưa có lượt nào. */
export function retentionRate(correct: number, total: number): number | null {
  return total > 0 ? correct / total : null;
}
