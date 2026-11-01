import type { Metadata } from "next";
import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActor } from "@/server/auth/session";
import { listTopicLessons } from "@/server/dal/practice";
import { EmptyState, PageHeader } from "@/components/ui";
import { LessonList } from "@/features/practice/components/lesson-list";
import { ProgressBar } from "@/features/practice/components/progress-bar";
import { findTopic, parseTopicParam } from "@/features/practice/params";

export async function generateMetadata({
  params,
}: PageProps<"/learn/topics/[topic]">): Promise<Metadata> {
  const topic = findTopic((await params).topic);
  return { title: topic ? getMessages().topics[topic] : getMessages().practice.title };
}

export default async function TopicPage({ params }: PageProps<"/learn/topics/[topic]">) {
  const m = getMessages();
  const t = m.practice;
  const topic = parseTopicParam((await params).topic);
  const actor = await requireActor(routes.topic(topic));
  const lessons = await listTopicLessons(actor, topic);
  const total = lessons.reduce((sum, l) => sum + l.total, 0);
  const learned = lessons.reduce((sum, l) => sum + l.learned, 0);
  const name = m.topics[topic];

  return (
    <>
      <Link href={routes.learn} className="mb-2 inline-block text-sm font-medium text-accent">
        ← {t.allTopicsLink}
      </Link>
      <PageHeader title={name} />
      {lessons.length === 0 ? (
        <EmptyState title={t.noWords} description={t.noWordsDesc} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex max-w-md flex-col gap-1.5">
            <ProgressBar value={learned} max={total} label={fmt(t.progressLabel, { name })} />
            <p className="text-sm text-label-secondary tabular-nums">
              {fmt(t.topicMeta, { lessons: lessons.length, words: total })} ·{" "}
              {fmt(t.learned, { learned, total })}
            </p>
          </div>
          <section aria-labelledby="lessons-title">
            <h2 id="lessons-title" className="mb-3 text-xl font-semibold tracking-tight">
              {t.lessonsTitle}
            </h2>
            <LessonList topic={topic} lessons={lessons} />
          </section>
        </div>
      )}
    </>
  );
}
