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
    "whitespace-nowrap rounded-lg px-2 py-2 sm:px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-2 py-2 sm:px-4">
        <Link
          href={routes.home}
          className="mr-1 shrink-0 text-lg font-bold text-indigo-600 dark:text-indigo-400"
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
            <span className="hidden max-w-40 truncate text-sm text-zinc-600 sm:inline dark:text-zinc-400">
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
