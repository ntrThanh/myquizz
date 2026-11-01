import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { hasRole } from "@/server/auth/roles";
import { getActor } from "@/server/auth/session";
import { buttonClass } from "@/components/ui";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export async function SiteHeader() {
  const t = getMessages().nav;
  const actor = await getActor();
  const link =
    "press whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-label-secondary hover:bg-fill-4 hover:text-label";

  return (
    <header className="sticky top-0 z-20 px-3 pt-3">
      <div className="glass glass-liquid mx-auto flex max-w-5xl items-center gap-1 rounded-full py-1.5 pr-1.5 pl-4">
        <Link
          href={routes.home}
          className="mr-2 shrink-0 text-lg font-bold tracking-tight text-label"
        >
          {t.brand}
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {actor && (
            <Link className={link} href={routes.learn}>
              {t.learn}
            </Link>
          )}
          {hasRole(actor, "editor") && (
            // Ẩn trên điện thoại cho đủ chỗ; trang quản trị dạng bảng chủ yếu dùng trên máy tính.
            <Link className={`${link} hidden sm:block`} href={routes.admin}>
              {t.admin}
            </Link>
          )}
        </nav>
        {actor ? (
          <div className="flex items-center gap-1">
            <span className="hidden max-w-40 truncate px-2 text-sm text-label-secondary sm:inline">
              {actor.name}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link className={link} href={routes.login}>
              {t.login}
            </Link>
            <Link
              className={buttonClass("primary", "hidden sm:inline-flex")}
              href={routes.register}
            >
              {t.register}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
