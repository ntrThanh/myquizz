import type { Metadata } from "next";
import { formatDateTime, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActorRole } from "@/server/auth/session";
import { listUsers } from "@/server/dal/users";
import { Pagination } from "@/components/pagination";
import { Button, EmptyState, inputClass, PageHeader } from "@/components/ui";
import { RoleSelect } from "@/features/admin/components/role-select";

export const metadata: Metadata = { title: getMessages().admin.users };

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const t = getMessages().admin;
  const actor = await requireActorRole("admin", routes.adminUsers);
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const page = Number(sp.page) || 1;
  const { items, total, pageSize } = await listUsers(actor, { page, query });

  return (
    <>
      <PageHeader title={t.users}>
        <form className="flex w-full gap-2 sm:w-auto">
          <input
            name="q"
            defaultValue={query}
            placeholder={t.search}
            aria-label={t.search}
            className={inputClass}
          />
          <Button type="submit" variant="secondary">
            {t.searchButton}
          </Button>
        </form>
      </PageHeader>
      {items.length === 0 ? (
        <EmptyState title={t.noUsers} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">{t.colName}</th>
                <th className="px-4 py-2">{t.colEmail}</th>
                <th className="px-4 py-2">{t.colRole}</th>
                <th className="px-4 py-2">{t.colCreated}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">
                    {u.name} {u.id === actor.id && <span className="text-zinc-500">{t.you}</span>}
                  </td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    <RoleSelect userId={u.id} role={u.role} disabled={u.id === actor.id} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                    {formatDateTime(u.createdAt, actor.timeZone)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        href={(p) =>
          `${routes.adminUsers}?page=${p}${query ? `&q=${encodeURIComponent(query)}` : ""}`
        }
      />
    </>
  );
}
