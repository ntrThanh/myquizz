/** Chỉ cho phép chuyển hướng tới đường dẫn nội bộ, chặn open redirect (`//evil.com`, `https://…`). */
export function safeNext(next: string | null | undefined, fallback = "/learn"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
