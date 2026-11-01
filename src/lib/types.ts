// Kiểu dùng chung cho cả server và client.

export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type Role = "user" | "editor" | "admin";

export const ROLES: readonly Role[] = ["user", "editor", "admin"];
