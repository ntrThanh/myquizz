import type { Db } from "mongodb";

export interface Migration {
  /** Dạng `NNNN-ten-ngan`, tăng dần. Không đổi sau khi đã chạy ở bất kỳ môi trường nào. */
  id: string;
  /** Phải idempotent: chạy lại không gây lỗi hay nhân đôi dữ liệu. */
  up(db: Db): Promise<void>;
  down?(db: Db): Promise<void>;
}
