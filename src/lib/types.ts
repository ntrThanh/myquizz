// Kiểu dùng chung cho cả server và client.

export type ContentStatus = "draft" | "published";
export type Role = "user" | "editor" | "admin";
export type StudyMode = "flashcard" | "quiz" | "typing";

export const ROLES: readonly Role[] = ["user", "editor", "admin"];
