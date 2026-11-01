import type { Metadata } from "next";
import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { hasRole } from "@/server/auth/roles";
import { requireActorRole } from "@/server/auth/session";
import { countUsers } from "@/server/dal/users";
import { countWords } from "@/server/dal/words";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: getMessages().admin.title };

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
      </Card>
    </Link>
  );
}

export default async function AdminPage() {
  const t = getMessages().admin;
  const actor = await requireActorRole("editor", routes.admin);
  const isAdmin = hasRole(actor, "admin");
  const [words, users] = await Promise.all([
    countWords(actor),
    isAdmin ? countUsers(actor) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader title={t.title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile href={routes.adminWords} title={t.words} desc={fmt(t.wordCount, { count: words })} />
        {users !== null && (
          <Tile
            href={routes.adminUsers}
            title={t.users}
            desc={fmt(t.userCount, { count: users })}
          />
        )}
      </div>
    </>
  );
}
