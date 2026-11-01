import type { Metadata } from "next";
import { formatDateTime, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActorRole } from "@/server/auth/session";
import { listAuditLogs } from "@/server/dal/audit";
import { Pagination } from "@/components/pagination";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: getMessages().admin.audit };

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const t = getMessages().admin;
  const actor = await requireActorRole("admin", routes.adminAudit);
  const page = Number((await searchParams).page) || 1;
  const { items, total, pageSize } = await listAuditLogs(actor, { page, pageSize: 50 });

  return (
    <>
      <PageHeader title={t.audit} />
      {items.length === 0 ? (
        <EmptyState title={t.noAudit} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">{t.colTime}</th>
                <th className="px-4 py-2">{t.colActor}</th>
                <th className="px-4 py-2">{t.colAction}</th>
                <th className="px-4 py-2">{t.colTarget}</th>
                <th className="px-4 py-2">{t.colDetail}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                    {formatDateTime(a.createdAt, actor.timeZone)}
                  </td>
                  <td className="px-4 py-2">{a.actorEmail ?? t.cli}</td>
                  <td className="px-4 py-2 font-mono text-xs">{a.action}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {a.target.type}:{a.target.id}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {a.meta ? JSON.stringify(a.meta) : ""}
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
        href={(p) => `${routes.adminAudit}?page=${p}`}
      />
    </>
  );
}
