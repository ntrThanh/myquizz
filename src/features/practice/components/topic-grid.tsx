import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { TOPIC_GROUPS, type TopicGroup } from "@/lib/topics";
import type { TopicProgress } from "@/server/dal/practice";
import { ProgressBar } from "@/features/practice/components/progress-bar";

/** Thẻ các chủ đề có từ để luyện, chia theo nhóm, kèm số bài và tiến độ của người xem. */
export function TopicGrid({ topics }: { topics: TopicProgress[] }) {
  const m = getMessages();
  const t = m.practice;
  const groups = (Object.keys(TOPIC_GROUPS) as TopicGroup[])
    .map((group) => ({
      group,
      items: topics.filter((p) => (TOPIC_GROUPS[group] as readonly string[]).includes(p.topic)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ group, items }) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h3
            id={`group-${group}`}
            className="mb-3 text-sm font-semibold tracking-wide text-label-secondary uppercase"
          >
            {m.topicGroups[group]}
          </h3>
          <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const name = m.topics[p.topic];
              return (
                <li key={p.topic}>
                  <Link
                    href={routes.topic(p.topic)}
                    className="press glass flex h-full flex-col gap-3 rounded-3xl p-5 hover:brightness-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div>
                      <p className="text-lg font-semibold tracking-tight">{name}</p>
                      <p className="text-sm text-label-secondary">
                        {fmt(t.topicMeta, { lessons: p.lessons, words: p.total })}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-col gap-1.5">
                      <ProgressBar
                        value={p.learned}
                        max={p.total}
                        label={fmt(t.progressLabel, { name })}
                      />
                      <p className="text-xs text-label-secondary tabular-nums">
                        {fmt(t.learned, { learned: p.learned, total: p.total })}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
