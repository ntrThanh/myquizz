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
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-4 text-xs text-label-secondary uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2">{t.colTime}</th>
                <th className="px-4 py-2">{t.colActor}</th>
                <th className="px-4 py-2">{t.colAction}</th>
                <th className="px-4 py-2">{t.colTarget}</th>
                <th className="px-4 py-2">{t.colDetail}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-label-secondary">
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
