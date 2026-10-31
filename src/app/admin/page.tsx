import type { Metadata } from "next";
import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { hasRole } from "@/server/auth/roles";
import { requireActorRole } from "@/server/auth/session";
import { countUsers } from "@/server/dal/users";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: getMessages().admin.title };

export default async function AdminPage() {
  const t = getMessages().admin;
  const actor = await requireActorRole("editor", "/admin");
  const isAdmin = hasRole(actor, "admin");
  const users = isAdmin ? await countUsers(actor) : null;

  return (
    <>
      <PageHeader title={t.title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-semibold">{getMessages().courses.title}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.contentSoon}</p>
        </Card>
        {isAdmin && (
          <Link href="/admin/users" className="group">
            <Card className="h-full group-hover:border-indigo-400">
              <h2 className="font-semibold">{t.users}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {fmt(t.userCount, { count: users ?? 0 })}
              </p>
            </Card>
          </Link>
        )}
      </div>
    </>
  );
}
