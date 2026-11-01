/** Nguồn số ngẫu nhiên trong [0, 1); truyền vào để test được kết quả cố định. */
export type Random = () => number;

/** Fisher–Yates, trả về mảng mới. */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pick<T>(items: readonly T[], random: Random = Math.random): T {
  if (items.length === 0) throw new Error("pick() cần mảng khác rỗng");
  return items[Math.floor(random() * items.length)]!;
}
