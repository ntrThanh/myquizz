import { startOfDayPlus } from "@/lib/day";

// Thuật toán SM-2 (CLAUDE.md §5.5). Hàm thuần: không đụng UI hay DB.

export interface Sm2State {
  /** Số lần nhớ đúng liên tiếp. */
  n: number;
  /** Hệ số dễ (easiness factor), tối thiểu 1.3. */
  ef: number;
  /** Khoảng cách ôn, đơn vị ngày. */
  interval: number;
}

export interface Sm2Result extends Sm2State {
  /** 00:00 của ngày đến hạn theo múi giờ người dùng, dạng UTC. */
  dueDate: Date;
}

/** Điểm tự đánh giá 0-5. */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export const INITIAL_SM2: Sm2State = { n: 0, ef: 2.5, interval: 0 };
export const MIN_EF = 1.3;

/** Bốn nút chấm điểm trong chế độ ôn. */
export const GRADES = { again: 0, hard: 3, good: 4, easy: 5 } as const satisfies Record<
  string,
  Quality
>;
export type Grade = keyof typeof GRADES;

/** Quiz và gõ đáp án: đúng = Good, sai = Again. */
export function qualityFromAnswer(correct: boolean): Quality {
  return correct ? GRADES.good : GRADES.again;
}

export function nextEf(ef: number, q: Quality): number {
  const raw = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  // Mọi bước tăng/giảm đều là bội của 0.02: làm tròn 2 chữ số để không tích lũy sai số float.
  return Math.max(MIN_EF, Math.round(raw * 100) / 100);
}

export interface ReviewOptions {
  now: Date;
  /** Múi giờ IANA của người dùng, vd. "Asia/Ho_Chi_Minh". */
  timeZone: string;
}

export function review(state: Sm2State, q: Quality, { now, timeZone }: ReviewOptions): Sm2Result {
  if (!Number.isInteger(q) || q < 0 || q > 5) {
    throw new RangeError(`Điểm q phải là số nguyên 0-5, nhận được ${q}`);
  }

  let n: number;
  let interval: number;
  if (q < 3) {
    n = 0;
    interval = 1;
  } else {
    n = state.n + 1;
    if (n === 1) interval = 1;
    else if (n === 2) interval = 6;
    // Dùng ef cũ (trước khi cập nhật), theo thứ tự của SM-2 gốc.
    else interval = Math.round(state.interval * state.ef);
  }

  return {
    n,
    ef: nextEf(state.ef, q),
    interval,
    dueDate: startOfDayPlus(now, interval, timeZone),
  };
}
