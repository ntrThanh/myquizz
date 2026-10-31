import type { Metadata } from "next";
import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { getActor } from "@/server/auth/session";
import { listCourses } from "@/server/dal/courses";
import { Pagination } from "@/components/pagination";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: getMessages().courses.title };

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const t = getMessages();
  const page = Number((await searchParams).page) || 1;
  const { items, total, pageSize } = await listCourses(await getActor(), { page, pageSize: 12 });

  return (
    <>
      <PageHeader title={t.courses.title} />
      {items.length === 0 ? (
        <EmptyState title={t.courses.empty} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{c.title}</h2>
                  {c.status === "draft" && <Badge tone="amber">{t.common.draft}</Badge>}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.description}</p>
                <p className="mt-3 text-xs text-zinc-500">
                  {fmt(t.courses.lessons, { count: c.lessonCount })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        href={(p) => `/courses?page=${p}`}
      />
    </>
  );
}
