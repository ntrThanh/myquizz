// Đường dẫn trong app, dùng chung thay vì viết chuỗi rời rạc ở từng component.
// Riêng `config.matcher` trong src/proxy.ts phải là hằng tĩnh nên viết trực tiếp ở đó.

export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  learn: "/learn",
  practice: "/learn/practice",
  admin: "/admin",
  adminWords: "/admin/words",
  adminNewWord: "/admin/words/new",
  adminWord: (id: string) => `/admin/words/${id}`,
  adminUsers: "/admin/users",
  adminAudit: "/admin/audit",
} as const;

/** Nối query string vào đường dẫn, bỏ qua khi rỗng. */
export function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}
