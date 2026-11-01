// So khớp đáp án gõ. Hàm thuần, dùng được cả hai phía.

/** Các nghĩa trong một ô được tách bằng dấu phẩy hoặc chấm phẩy: "cơm, gạo". */
const ALTERNATIVE_SEPARATOR = /[,;]/;

/**
 * Không phân biệt hoa thường, bỏ khoảng trắng thừa. Chuẩn hóa Unicode NFC để chữ có dấu gõ từ
 * các bộ gõ khác nhau (dựng sẵn hay tổ hợp) vẫn khớp.
 */
export function normalizeAnswer(s: string): string {
  return s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Mọi cách trả lời được chấp nhận: cả chuỗi, hoặc từng nghĩa tách riêng. */
export function acceptedAnswers(answer: string): string[] {
  const parts = answer.split(ALTERNATIVE_SEPARATOR).map(normalizeAnswer);
  return [...new Set([normalizeAnswer(answer), ...parts])].filter(Boolean);
}

export function isCorrectAnswer(given: string, answer: string): boolean {
  const g = normalizeAnswer(given);
  return g !== "" && acceptedAnswers(answer).includes(g);
}
