import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { hasRole } from "@/server/auth/roles";
import { requireActorRole } from "@/server/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const actor = await requireActorRole("editor", routes.admin);
  const t = getMessages().admin;
  const link =
    "rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800";
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Link className={link} href={routes.admin}>
          {t.title}
        </Link>
        <Link className={link} href={routes.adminWords}>
          {t.words}
        </Link>
        {hasRole(actor, "admin") && (
          <>
            <Link className={link} href={routes.adminUsers}>
              {t.users}
            </Link>
            <Link className={link} href={routes.adminAudit}>
              {t.audit}
            </Link>
          </>
        )}
      </nav>
      {children}
    </div>
  );
}
