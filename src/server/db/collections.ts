import "server-only";
import type { Document, ObjectId } from "mongodb";
import type { ContentStatus, Role, StudyMode } from "@/lib/types";
import { getDb } from "@/server/db/client";

// Kiểu document trong MongoDB. ObjectId chỉ dùng phía server; ra client thì đổi sang chuỗi.

export type { ContentStatus, Role, StudyMode };

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

export interface CourseDoc extends Timestamps {
  _id: ObjectId;
  slug: string;
  title: string;
  description: string;
  status: ContentStatus;
  sort: number;
}

export interface LessonDoc extends Timestamps {
  _id: ObjectId;
  courseId: ObjectId;
  title: string;
  status: ContentStatus;
  sort: number;
}

export interface WordDoc extends Timestamps {
  _id: ObjectId;
  lessonId: ObjectId;
  courseId: ObjectId;
  word: string;
  meaningVi: string;
  ipa?: string;
  example?: string;
  audioUrl?: string;
  status: ContentStatus;
}

export interface UserWordProgressDoc extends Timestamps {
  _id: ObjectId;
  userId: ObjectId;
  wordId: ObjectId;
  courseId: ObjectId;
  lessonId: ObjectId;
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
  mode: StudyMode;
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
  courses: () => getDb().collection<CourseDoc>("courses"),
  lessons: () => getDb().collection<LessonDoc>("lessons"),
  words: () => getDb().collection<WordDoc>("words"),
  userWordProgress: () => getDb().collection<UserWordProgressDoc>("userWordProgress"),
  reviewLogs: () => getDb().collection<ReviewLogDoc>("reviewLogs"),
  auditLogs: () => getDb().collection<AuditLogDoc>("auditLogs"),
};
