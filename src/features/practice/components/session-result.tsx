"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { fmt, getMessages } from "@/lib/i18n";
import type { Question } from "@/lib/practice/questions";
import { Button, ButtonLink, Card } from "@/components/ui";

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Vòng tròn tỉ lệ đúng, tự vẽ từ 0 khi hiện ra. */
function ScoreRing({ ratio }: { ratio: number }) {
  const color = ratio >= 0.8 ? "var(--green)" : ratio >= 0.5 ? "var(--accent)" : "var(--orange)";
  return (
    <div className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="10"
          stroke="var(--fill-3)"
        />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - ratio)}
          className="animate-ring"
          style={{ "--ring-length": RING_LENGTH } as CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-3xl font-bold tracking-tight tabular-nums">
        {Math.round(ratio * 100)}%
      </span>
    </div>
  );
}

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
  const correct = total - wrong.length;
  return (
    <Card className="stagger mx-auto flex w-full max-w-xl flex-col gap-5 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-xl font-semibold tracking-tight">{t.resultTitle}</h2>
        <ScoreRing ratio={total === 0 ? 0 : correct / total} />
        <p className="text-lg font-semibold text-label-secondary tabular-nums">
          {fmt(t.score, { correct, total })}
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">{t.wrongList}</h3>
        {wrong.length === 0 ? (
          <p className="text-sm text-label-secondary">{t.allCorrect}</p>
        ) : (
          <ul className="stagger divide-y divide-separator overflow-hidden rounded-2xl bg-fill-4">
            {wrong.map((q) => (
              <li key={q.wordId} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium" lang={q.promptLang}>
                  {q.prompt}
                </span>
                <span className="text-right text-label-secondary" lang={q.answerLang}>
                  {q.answer}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          autoFocus
          className="px-6"
          onClick={() => {
            onRestart();
            router.refresh(); // lấy bộ câu hỏi mới từ server
          }}
        >
          {t.again}
        </Button>
        <ButtonLink href={settingsHref} variant="secondary" className="px-6">
          {t.changeSettings}
        </ButtonLink>
      </div>
    </Card>
  );
}
