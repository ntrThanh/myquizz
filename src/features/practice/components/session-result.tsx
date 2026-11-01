"use client";

import { useRouter } from "next/navigation";
import { fmt, getMessages } from "@/lib/i18n";
import type { Question } from "@/lib/practice/questions";
import { Button, ButtonLink, Card } from "@/components/ui";

/** Màn hình cuối lượt: điểm và danh sách câu làm sai. */
export function SessionResult({
  total,
  wrong,
  settingsHref,
  onRestart,
}: {
  total: number;
  wrong: Question[];
  settingsHref: string;
  onRestart: () => void;
}) {
  const router = useRouter();
  const t = getMessages().practice;
  return (
    <Card className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
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
            {wrong.map((q) => (
              <li key={q.wordId} className="flex justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium" lang={q.promptLang}>
                  {q.prompt}
                </span>
                <span className="text-right text-zinc-600 dark:text-zinc-400" lang={q.answerLang}>
                  {q.answer}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          autoFocus
          onClick={() => {
            onRestart();
            router.refresh(); // lấy bộ câu hỏi mới từ server
          }}
        >
          {t.again}
        </Button>
        <ButtonLink href={settingsHref} variant="secondary">
          {t.changeSettings}
        </ButtonLink>
      </div>
    </Card>
  );
}
