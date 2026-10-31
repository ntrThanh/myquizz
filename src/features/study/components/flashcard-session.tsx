"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { GRADES, type Grade } from "@/lib/sm2";
import type { StudyCard } from "@/server/dal/study";
import { Alert, Button, ButtonLink, Card, EmptyState } from "@/components/ui";
import { submitReviewAction } from "@/features/study/actions";
import { useHotkeys } from "@/features/study/components/use-hotkeys";
import { WordFace } from "@/features/study/components/word-face";

const t = getMessages().review;

const BUTTONS: { grade: Grade; label: string; key: string; className: string }[] = [
  {
    grade: "again",
    label: t.again,
    key: "1",
    className: "bg-rose-600 hover:bg-rose-500 text-white",
  },
  {
    grade: "hard",
    label: t.hard,
    key: "2",
    className: "bg-amber-500 hover:bg-amber-400 text-white",
  },
  {
    grade: "good",
    label: t.good,
    key: "3",
    className: "bg-emerald-600 hover:bg-emerald-500 text-white",
  },
  { grade: "easy", label: t.easy, key: "4", className: "bg-sky-600 hover:bg-sky-500 text-white" },
];

export function FlashcardSession({ cards, totalDue }: { cards: StudyCard[]; totalDue: number }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const card = cards[index];

  function grade(g: Grade) {
    if (!card || !flipped || pending) return;
    setError(null);
    start(async () => {
      const res = await submitReviewAction({
        mode: "flashcard",
        wordId: card.wordId,
        q: GRADES[g],
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFlipped(false);
      setIndex((i) => i + 1);
    });
  }

  useHotkeys((key, e) => {
    if (key === " " || key === "Enter") {
      e.preventDefault();
      if (!flipped) setFlipped(true);
      return;
    }
    const b = BUTTONS.find((x) => x.key === key);
    if (b) grade(b.grade);
  });

  if (cards.length === 0) {
    return (
      <EmptyState
        title={t.noneDue}
        description={t.noneDueDesc}
        action={<ButtonLink href="/learn/quiz">{getMessages().learn.modeQuiz}</ButtonLink>}
      />
    );
  }

  if (!card) {
    return (
      <EmptyState
        title={t.doneTitle}
        description={fmt(t.doneDesc, { count: cards.length })}
        action={
          totalDue > cards.length ? (
            <Button onClick={() => router.refresh()}>{t.more}</Button>
          ) : (
            <ButtonLink href="/learn">{getMessages().common.back}</ButtonLink>
          )
        }
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <p className="text-sm text-zinc-500" aria-live="polite">
        {fmt(t.remaining, { count: totalDue - index })}
      </p>
      <button
        type="button"
        onClick={() => setFlipped(true)}
        aria-label={t.flip}
        className="text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
      >
        <Card className="flex min-h-64 flex-col items-center justify-center gap-4 p-8">
          <WordFace card={card} />
          {flipped && (
            <div className="border-t border-zinc-200 pt-4 text-center dark:border-zinc-800">
              <p className="text-xl font-medium">{card.meaningVi}</p>
              {card.example && (
                <p className="mt-2 text-sm text-zinc-600 italic dark:text-zinc-400" lang="en">
                  {card.example}
                </p>
              )}
            </div>
          )}
        </Card>
      </button>
      {error && <Alert>{error}</Alert>}
      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {BUTTONS.map((b) => (
            <button
              key={b.grade}
              type="button"
              disabled={pending}
              onClick={() => grade(b.grade)}
              className={`flex flex-col items-center rounded-lg px-2 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${b.className}`}
            >
              {b.label}
              <kbd className="mt-0.5 text-xs font-normal opacity-80">{b.key}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <Button onClick={() => setFlipped(true)} className="py-3 text-base">
          {t.flip}
        </Button>
      )}
      <p className="hidden text-center text-xs text-zinc-500 sm:block">{t.flipHint}</p>
    </div>
  );
}
