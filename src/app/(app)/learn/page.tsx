import type { Metadata } from "next";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActor } from "@/server/auth/session";
import { getStats, listPracticeTopics } from "@/server/dal/practice";
import { EmptyState, PageHeader } from "@/components/ui";
import { PracticeSetupForm } from "@/features/practice/components/practice-setup-form";
import { StatsOverview } from "@/features/practice/components/stats-overview";
import { parsePracticeSettings } from "@/features/practice/schemas";

export const metadata: Metadata = { title: getMessages().practice.title };

export default async function LearnPage({ searchParams }: PageProps<"/learn">) {
  const t = getMessages().practice;
  const actor = await requireActor(routes.learn);
  const [stats, topics] = await Promise.all([getStats(actor), listPracticeTopics(actor)]);
  // Quay lại từ trang luyện tập thì giữ nguyên cài đặt vừa dùng.
  const defaults = parsePracticeSettings(await searchParams);

  return (
    <>
      <PageHeader title={t.title} />
      <div className="flex flex-col gap-8">
        <StatsOverview stats={stats} />
        {stats.totalWords === 0 ? (
          <EmptyState title={t.noWords} description={t.noWordsDesc} />
        ) : (
          <PracticeSetupForm defaults={defaults} topics={topics} />
        )}
      </div>
    </>
  );
}
