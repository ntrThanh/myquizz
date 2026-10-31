import { requireActor } from "@/server/auth/session";

// Kiểm tra đăng nhập thật cho cả khu vực học (proxy chỉ chặn sớm theo cookie).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireActor("/learn");
  return children;
}
