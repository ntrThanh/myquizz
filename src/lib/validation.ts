import { z } from "zod";

/** Id MongoDB dạng chuỗi hex 24 ký tự, như gửi lên từ client. */
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/);
