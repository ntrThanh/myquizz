"use client";

import { useRouter } from "next/navigation";
import { fmt, getMessages } from "@/lib/i18n";
import type { StudyCard } from "@/server/dal/study";
import { Button, ButtonLink, Card } from "@/components/ui";

/** Màn hình cuối phiên quiz / gõ đáp án: điểm và danh sách từ làm sai. */
export function SessionResult({
  total,
  wrong,
  onRestart,
}: {
  total: number;
  wrong: StudyCard[];
  onRestart: () => void;
}) {
  const router = useRouter();
  const t = getMessages().quiz;
  return (
    <Card className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold">{t.resultTitle}</h2>
      <p className="text-3xl font-bold tabular-nums">
        {fmt(t.score, { correct: total - wrong.length, total })}
      </p>
      <div>
        <h3 className="mb-2 font-medium">{t.wrongList}</h3>
        {wrong.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.allCorrect}</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {wrong.map((w) => (
              <li key={w.wordId} className="flex justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium" lang="en">
                  {w.word}
                </span>
                <span className="text-right text-zinc-600 dark:text-zinc-400">{w.meaningVi}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            onRestart();
            router.refresh(); // lấy bộ từ mới từ server
          }}
        >
          {t.again}
        </Button>
        <ButtonLink href="/learn" variant="secondary">
          {getMessages().common.back}
        </ButtonLink>
      </div>
    </Card>
  );
}
