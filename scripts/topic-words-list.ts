/** Tách chuỗi từ (cách nhau bằng dấu phẩy hoặc xuống dòng), bỏ khoảng trắng và mục rỗng. */
export const list = (s: string): readonly string[] =>
  s
    .split(/[,\n]/)
    .map((w) => w.trim())
    .filter(Boolean);
