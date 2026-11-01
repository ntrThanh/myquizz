import type { Migration } from "./types";
import { migration as m0001 } from "./scripts/0001-init";
import { migration as m0002 } from "./scripts/0002-core-collections";
import { migration as m0003 } from "./scripts/0003-standalone-words";
import { migration as m0004 } from "./scripts/0004-word-topics";

// Danh sách tường minh (thay vì quét thư mục) để có thể bundle thành một file chạy trong image.
// Thêm migration mới vào cuối mảng.
export const migrations: Migration[] = [m0001, m0002, m0003, m0004];
