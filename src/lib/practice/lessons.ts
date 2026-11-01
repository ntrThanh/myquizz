import { LESSON_SIZE } from "@/lib/practice/config";

// Chia danh sách từ (đã xếp theo thứ tự học) thành các bài liên tiếp, mỗi bài `size` từ.

export function lessonCount(total: number, size = LESSON_SIZE): number {
  return Math.ceil(Math.max(total, 0) / size);
}

/** Phần tử của bài thứ `lesson` (đánh số từ 1); bài không tồn tại thì trả về mảng rỗng. */
export function lessonSlice<T>(items: readonly T[], lesson: number, size = LESSON_SIZE): T[] {
  if (!Number.isInteger(lesson) || lesson < 1) return [];
  return items.slice((lesson - 1) * size, lesson * size);
}

/** Đếm số phần tử thỏa `pred` trong từng bài. */
export function countPerLesson<T>(
  items: readonly T[],
  pred: (item: T) => boolean,
  size = LESSON_SIZE,
): { total: number; matched: number }[] {
  return Array.from({ length: lessonCount(items.length, size) }, (_, i) => {
    const part = lessonSlice(items, i + 1, size);
    return { total: part.length, matched: part.filter(pred).length };
  });
}
