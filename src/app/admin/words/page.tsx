import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime, getMessages } from "@/lib/i18n";
import { routes, withQuery } from "@/lib/routes";
import { CONTENT_STATUSES, type ContentStatus } from "@/lib/types";
import { requireActorRole } from "@/server/auth/session";
import { listWords } from "@/server/dal/words";
import { Pagination } from "@/components/pagination";
import { Badge, Button, ButtonLink, EmptyState, inputClass, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: getMessages().admin.words };

const MAX_QUERY_LENGTH = 100;

function parseStatus(v: unknown): ContentStatus | undefined {
  return CONTENT_STATUSES.find((s) => s === v);
}

export default async function WordsPage({ searchParams }: PageProps<"/admin/words">) {
  const t = getMessages().admin;
  const actor = await requireActorRole("editor", routes.adminWords);
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.slice(0, MAX_QUERY_LENGTH) : "";
  const status = parseStatus(sp.status);
  const page = Number(sp.page) || 1;
  const { items, total, pageSize } = await listWords(actor, { page, query, status });

  const filters = (p: number) => {
    const params = new URLSearchParams({ page: String(p) });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    return withQuery(routes.adminWords, params.toString());
  };

  return (
    <>
      <PageHeader title={t.words}>
        <ButtonLink href={routes.adminNewWord}>{t.word.new}</ButtonLink>
      </PageHeader>
      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={query}
          placeholder={t.word.search}
          aria-label={t.word.search}
          className={inputClass}
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label={t.word.status}
          className={`${inputClass} sm:w-48`}
        >
          <option value="">{t.word.allStatuses}</option>
          {CONTENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.word.statuses[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          {t.searchButton}
        </Button>
      </form>
      {items.length === 0 ? (
        <EmptyState
          title={t.word.empty}
          description={query || status ? undefined : t.word.emptyDesc}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">{t.word.word}</th>
                <th className="px-4 py-2">{t.word.meaningVi}</th>
                <th className="px-4 py-2">{t.word.status}</th>
                <th className="px-4 py-2">{t.word.colUpdated}</th>
                <th className="px-4 py-2">
                  <span className="sr-only">{t.word.editLink}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2 font-medium" lang="en">
                    {w.word}
                    {w.ipa && <span className="ml-2 font-normal text-zinc-500">{w.ipa}</span>}
                  </td>
                  <td className="px-4 py-2">{w.meaningVi}</td>
                  <td className="px-4 py-2">
                    <Badge tone={w.status === "draft" ? "amber" : "indigo"}>
                      {t.word.statuses[w.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-500">
                    {formatDateTime(w.updatedAt, actor.timeZone)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={routes.adminWord(w.id)}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {t.word.editLink}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} href={filters} />
    </>
  );
}
