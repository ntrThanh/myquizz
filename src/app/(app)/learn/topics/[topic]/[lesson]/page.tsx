import type { Metadata } from "next";
import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActor } from "@/server/auth/session";
import { getLessonWords } from "@/server/dal/practice";
import { notFoundOn } from "@/features/practice/not-found-on";
import { PageHeader } from "@/components/ui";
import { PracticeSetupForm } from "@/features/practice/components/practice-setup-form";
import { ProgressBar } from "@/features/practice/components/progress-bar";
import { lessonName } from "@/features/practice/lesson-name";
import { findTopic, parseLessonParam, parseTopicParam } from "@/features/practice/params";
import { parsePracticeSettings } from "@/features/practice/schemas";

export async function generateMetadata({
  params,
}: PageProps<"/learn/topics/[topic]/[lesson]">): Promise<Metadata> {
  const { topic, lesson } = await params;
  const found = findTopic(topic);
  return { title: found ? lessonName(found, Number(lesson)) : getMessages().practice.title };
}

export default async function LessonPage({
  params,
  searchParams,
}: PageProps<"/learn/topics/[topic]/[lesson]">) {
  const m = getMessages();
  const t = m.practice;
  const p = await params;
  const topic = parseTopicParam(p.topic);
  const lesson = parseLessonParam(p.lesson);
  const actor = await requireActor(routes.lesson(topic, lesson));
  const words = await getLessonWords(actor, topic, lesson).catch(notFoundOn);
  const learned = words.filter((w) => w.learned).length;
  const name = lessonName(topic, lesson);
  // Quay lại từ trang luyện tập thì giữ chế độ/chiều hỏi/số câu vừa dùng.
  const defaults = { ...parsePracticeSettings(await searchParams), topic, lesson };

  return (
    <>
      <Link
        href={routes.topic(topic)}
        className="mb-2 inline-block text-sm font-medium text-accent"
      >
        ← {m.topics[topic]}
      </Link>
      <PageHeader title={name} />
      <div className="flex flex-col gap-8">
        <div className="flex max-w-md flex-col gap-1.5">
          <ProgressBar value={learned} max={words.length} label={fmt(t.progressLabel, { name })} />
          <p className="text-sm text-label-secondary tabular-nums">
            {fmt(t.learned, { learned, total: words.length })}
          </p>
        </div>
        <PracticeSetupForm defaults={defaults} />
        <section aria-labelledby="words-title">
          <h2 id="words-title" className="mb-3 text-xl font-semibold tracking-tight">
            {t.lessonWords}
          </h2>
          <ul className="glass divide-y divide-separator overflow-hidden rounded-3xl">
            {words.map((w) => (
              <li key={w.id} className="flex items-baseline gap-3 px-5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold" lang="en">
                    {w.word}
                  </span>
                  {w.ipa && <span className="ml-2 text-sm text-label-secondary">{w.ipa}</span>}
                  <span className="block text-sm text-label-secondary">{w.meaningVi}</span>
                </span>
                {w.learned && (
                  <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success-ink">
                    {t.learnedBadge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
