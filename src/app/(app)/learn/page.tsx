import type { Metadata } from "next";
import { fmt, getMessages } from "@/lib/i18n";
import { DEFAULT_PRACTICE_SETTINGS, LESSON_SIZE, PRACTICE_MODES } from "@/lib/practice/config";
import { routes, withQuery } from "@/lib/routes";
import { requireActor } from "@/server/auth/session";
import { getStats, listTopicProgress } from "@/server/dal/practice";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { StatsOverview } from "@/features/practice/components/stats-overview";
import { TopicGrid } from "@/features/practice/components/topic-grid";
import { practiceSettingsQuery } from "@/features/practice/schemas";

export const metadata: Metadata = { title: getMessages().practice.title };

export default async function LearnPage() {
  const t = getMessages().practice;
  const actor = await requireActor(routes.learn);
  const [stats, topics] = await Promise.all([getStats(actor), listTopicProgress(actor)]);

  if (stats.totalWords === 0) {
    return (
      <>
        <PageHeader title={t.title} />
        <EmptyState title={t.noWords} description={t.noWordsDesc} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t.title} />
      <div className="flex flex-col gap-10">
        <StatsOverview stats={stats} />
        <section aria-labelledby="topics-title" className="flex flex-col gap-4">
          <div>
            <h2 id="topics-title" className="text-xl font-semibold tracking-tight">
              {t.topicsTitle}
            </h2>
            <p className="text-sm text-label-secondary">
              {fmt(t.topicsDesc, { count: LESSON_SIZE })}
            </p>
          </div>
          {topics.length === 0 ? <EmptyState title={t.noTopics} /> : <TopicGrid topics={topics} />}
        </section>
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t.quickReview}</h2>
            <p className="text-sm text-label-secondary">{t.quickReviewDesc}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_MODES.map((mode, i) => (
              <ButtonLink
                key={mode}
                variant={i === 0 ? "primary" : "secondary"}
                href={withQuery(
                  routes.practice,
                  practiceSettingsQuery({
                    ...DEFAULT_PRACTICE_SETTINGS,
                    mode,
                    direction: "mixed",
                    count: 20,
                  }),
                )}
              >
                {t.modes[mode].title}
              </ButtonLink>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
