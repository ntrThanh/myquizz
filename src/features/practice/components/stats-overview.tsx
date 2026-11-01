import { fmt, getMessages } from "@/lib/i18n";
import type { PracticeStats } from "@/server/dal/practice";
import { Card } from "@/components/ui";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </Card>
  );
}

export function StatsOverview({ stats }: { stats: PracticeStats }) {
  const t = getMessages().practice.stats;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
