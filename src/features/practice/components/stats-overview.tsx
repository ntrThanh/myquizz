import { fmt, getMessages } from "@/lib/i18n";
import type { PracticeStats } from "@/server/dal/practice";
import { Card } from "@/components/ui";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-wide text-label-secondary uppercase">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-label-secondary">{hint}</p>}
    </Card>
  );
}

export function StatsOverview({ stats }: { stats: PracticeStats }) {
  const t = getMessages().practice.stats;
  return (
    <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat
        label={t.learnedWords}
        value={`${stats.learnedWords}/${stats.totalWords}`}
        hint={t.totalWords}
      />
      <Stat label={t.dueToday} value={String(stats.dueToday)} />
      <Stat label={t.streak} value={fmt(t.streakDays, { count: stats.streak })} />
      <Stat
        label={t.accuracy}
        value={stats.accuracy7d === null ? t.noData : `${Math.round(stats.accuracy7d * 100)}%`}
        hint={fmt(t.answers7d, { count: stats.answers7d })}
      />
    </div>
  );
}
