import { routes } from "@/lib/routes";
import { requireActor } from "@/server/auth/session";

// Kiểm tra đăng nhập thật cho cả khu vực học (proxy chỉ chặn sớm theo cookie).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireActor(routes.learn);
  return children;
}
