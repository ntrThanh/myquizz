import "server-only";
import type { Document, ObjectId } from "mongodb";
import type { Direction, PracticeMode } from "@/lib/practice/config";
import type { Topic } from "@/lib/topics";
import type { ContentStatus, Role } from "@/lib/types";
import { getDb } from "@/server/db/client";

// Kiểu document trong MongoDB. ObjectId chỉ dùng phía server; ra client thì đổi sang chuỗi.

export type { ContentStatus, Role };

interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/** Do Better Auth quản lý; chỉ khai báo các field app đọc. */
export interface UserDoc extends Timestamps {
  _id: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: Role;
  timeZone: string;
}

/** Một mục từ vựng dùng chung cho mọi người học. Chưa gắn khóa học (sẽ thêm ở giai đoạn sau). */
export interface WordDoc extends Timestamps {
  _id: ObjectId;
  word: string;
  meaningVi: string;
  ipa?: string;
  example?: string;
  /** Một hoặc nhiều chủ đề. (Field `topic` cũ còn trong dữ liệu, sẽ xóa ở migration sau.) */
  topics: Topic[];
  /**
   * Thứ tự học trong từng chủ đề (vị trí trong danh sách soạn sẵn); dùng để chia bài. Từ không
   * có thứ tự (thêm tay) xếp sau, theo thời gian tạo.
   */
  topicRanks?: Partial<Record<Topic, number>>;
  /** Nguồn khi nạp hàng loạt (ví dụ `fvdp`); không có nghĩa là thêm tay. */
  source?: string;
  status: ContentStatus;
}

export interface UserWordProgressDoc extends Timestamps {
  _id: ObjectId;
  userId: ObjectId;
  wordId: ObjectId;
  n: number;
  ef: number;
  interval: number;
  dueDate: Date;
  lastReviewedAt: Date | null;
}

export interface ReviewLogDoc {
  _id: ObjectId;
  userId: ObjectId;
  wordId: ObjectId;
  q: number;
  /** "flashcard" chỉ có ở dữ liệu cũ (trước khi bỏ chế độ flashcard). */
  mode: PracticeMode | "flashcard";
  /** Chiều hỏi; không có ở dữ liệu cũ. */
  direction?: Direction;
  /** Trạng thái trước/sau để sau này có thể tính lại bằng FSRS. */
  before: { n: number; ef: number; interval: number };
  after: { n: number; ef: number; interval: number; dueDate: Date };
  reviewedAt: Date;
}

export interface AuditLogDoc {
  _id: ObjectId;
  /** null khi thao tác từ CLI trên server. */
  actorId: ObjectId | null;
  action: string;
  target: { type: string; id: string };
  meta?: Document;
  createdAt: Date;
}

export const collections = {
  users: () => getDb().collection<UserDoc>("users"),
  words: () => getDb().collection<WordDoc>("words"),
  userWordProgress: () => getDb().collection<UserWordProgressDoc>("userWordProgress"),
  reviewLogs: () => getDb().collection<ReviewLogDoc>("reviewLogs"),
  auditLogs: () => getDb().collection<AuditLogDoc>("auditLogs"),
};
