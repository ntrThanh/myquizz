import type { Metadata } from "next";
import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { requireActor } from "@/server/auth/session";
import { getStats } from "@/server/dal/study";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: getMessages().learn.title };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </Card>
  );
}

export default async function LearnPage() {
  const t = getMessages();
  const s = await getStats(await requireActor("/learn"));

  const modes = [
    {
      href: "/learn/review",
      title: t.learn.modeReview,
      desc: t.learn.modeReviewDesc,
      badge: s.dueToday,
    },
    { href: "/learn/quiz", title: t.learn.modeQuiz, desc: t.learn.modeQuizDesc },
    { href: "/learn/typing", title: t.learn.modeTyping, desc: t.learn.modeTypingDesc },
  ];

  return (
    <>
      <PageHeader title={t.learn.title} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t.learn.dueToday} value={String(s.dueToday)} />
        <Stat label={t.learn.totalLearning} value={String(s.totalLearning)} />
        <Stat label={t.learn.streak} value={fmt(t.learn.streakDays, { count: s.streak })} />
        <Stat
          label={t.learn.retention}
          value={s.retention7d === null ? t.learn.noData : `${Math.round(s.retention7d * 100)}%`}
          hint={fmt(t.learn.reviews7d, { count: s.reviews7d })}
        />
      </div>

      <div className="mt-8">
        {s.totalLearning === 0 ? (
          <EmptyState
            title={t.learn.emptyTitle}
            description={t.learn.emptyDesc}
            action={<ButtonLink href="/courses">{t.empty.goCourses}</ButtonLink>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {modes.map((m) => (
              <Link key={m.href} href={m.href} className="group">
                <Card className="h-full transition-colors group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{m.title}</h2>
                    {m.badge ? (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {m.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
