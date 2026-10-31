import type { Migration } from "./types";
import { migration as m0001 } from "./scripts/0001-init";

// Danh sách tường minh (thay vì quét thư mục) để có thể bundle thành một file chạy trong image.
// Thêm migration mới vào cuối mảng.
export const migrations: Migration[] = [m0001];
