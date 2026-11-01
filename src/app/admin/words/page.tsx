import type { Metadata } from "next";
import { formatDateTime, getMessages } from "@/lib/i18n";
import { routes, withQuery } from "@/lib/routes";
import { TOPICS, type Topic } from "@/lib/topics";
import { CONTENT_STATUSES, type ContentStatus } from "@/lib/types";
import { requireActorRole } from "@/server/auth/session";
import { listWords } from "@/server/dal/words";
import { Pagination } from "@/components/pagination";
import { Button, ButtonLink, EmptyState, inputClass, PageHeader } from "@/components/ui";
import { WordTable } from "@/features/words/components/word-table";

export const metadata: Metadata = { title: getMessages().admin.words };

const MAX_QUERY_LENGTH = 100;
/** Trang dài hơn mặc định để duyệt và đăng nhiều từ một lượt. */
const PAGE_SIZE = 50;

function parseStatus(v: unknown): ContentStatus | undefined {
  return CONTENT_STATUSES.find((s) => s === v);
}

function parseTopic(v: unknown): Topic | undefined {
  return TOPICS.find((s) => s === v);
}

export default async function WordsPage({ searchParams }: PageProps<"/admin/words">) {
  const t = getMessages().admin;
  const topicLabels = getMessages().topics;
  const actor = await requireActorRole("editor", routes.adminWords);
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.slice(0, MAX_QUERY_LENGTH) : "";
  const status = parseStatus(sp.status);
  const topic = parseTopic(sp.topic);
  const page = Number(sp.page) || 1;
  const { items, total, pageSize } = await listWords(actor, {
    page,
    pageSize: PAGE_SIZE,
    query,
    status,
    topic,
  });

  const filters = (p: number) => {
    const params = new URLSearchParams({ page: String(p) });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (topic) params.set("topic", topic);
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
        <select
          name="topic"
          defaultValue={topic ?? ""}
          aria-label={t.word.topic}
          className={`${inputClass} sm:w-56`}
        >
          <option value="">{t.word.allTopics}</option>
          {TOPICS.map((s) => (
            <option key={s} value={s}>
              {topicLabels[s]}
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
          description={query || status || topic ? undefined : t.word.emptyDesc}
        />
      ) : (
        <WordTable
          rows={items.map((w) => ({
            id: w.id,
            word: w.word,
            ipa: w.ipa,
            meaningVi: w.meaningVi,
            topics: w.topics,
            status: w.status,
            updated: formatDateTime(w.updatedAt, actor.timeZone),
          }))}
        />
      )}
      <Pagination page={page} pageSize={pageSize} total={total} href={filters} />
    </>
  );
}
