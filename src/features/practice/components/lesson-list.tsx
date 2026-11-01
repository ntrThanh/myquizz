import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import type { Topic } from "@/lib/topics";
import type { LessonProgress } from "@/server/dal/practice";
import { ProgressBar } from "@/features/practice/components/progress-bar";
import { lessonName } from "@/features/practice/lesson-name";

/** Danh sách bài của một chủ đề ("Công việc 1", "Công việc 2"...) kèm tiến độ từng bài. */
export function LessonList({ topic, lessons }: { topic: Topic; lessons: LessonProgress[] }) {
  const t = getMessages().practice;
  return (
    <ol className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((l) => {
        const name = lessonName(topic, l.lesson);
        const done = l.total > 0 && l.learned === l.total;
        return (
          <li key={l.lesson}>
            <Link
              href={routes.lesson(topic, l.lesson)}
              className="press glass flex h-full flex-col gap-3 rounded-3xl p-5 hover:brightness-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg font-semibold tracking-tight">{name}</p>
                {done && (
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success-ink">
                    {t.learnedBadge}
                  </span>
                )}
              </div>
              <div className="mt-auto flex flex-col gap-1.5">
                <ProgressBar
                  value={l.learned}
                  max={l.total}
                  label={fmt(t.progressLabel, { name })}
                />
                <p className="text-xs text-label-secondary tabular-nums">
                  {fmt(t.learned, { learned: l.learned, total: l.total })}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
