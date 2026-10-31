"use client";

import { useRef, useState } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { qualityFromAnswer } from "@/lib/sm2";
import { normalizeAnswer } from "@/lib/stats";
import type { StudyCard } from "@/server/dal/study";
import { Alert, Button, Card, inputClass } from "@/components/ui";
import { submitReviewAction } from "@/features/study/actions";
import { SessionResult } from "@/features/study/components/session-result";

const t = getMessages().typing;

export function TypingSession({ cards }: { cards: StudyCard[] }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [wrong, setWrong] = useState<StudyCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const card = cards[index];

  if (!card) {
    return (
      <SessionResult
        total={cards.length}
        wrong={wrong}
        onRestart={() => {
          setIndex(0);
          setAnswer("");
          setResult(null);
          setWrong([]);
          setError(null);
        }}
      />
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!card) return;
    if (result !== null) {
      // Enter lần hai: sang từ tiếp theo.
      setResult(null);
      setAnswer("");
      setIndex((i) => i + 1);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (!answer.trim()) return;
    const correct = normalizeAnswer(answer) === normalizeAnswer(card.word);
    setResult(correct);
    if (!correct) setWrong((w) => [...w, card]);
    submitReviewAction({ mode: "typing", wordId: card.wordId, q: qualityFromAnswer(correct) }).then(
      (res) => {
        if (!res.ok) setError(res.error);
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {fmt(t.progress, { current: index + 1, total: cards.length })}
      </p>
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm text-zinc-500">{t.prompt}</p>
        <p className="text-3xl font-semibold">{card.meaningVi}</p>
      </Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="typing-answer">
          {t.placeholder}
        </label>
        <input
          id="typing-answer"
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          readOnly={result !== null}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          lang="en"
          placeholder={t.placeholder}
          className={`${inputClass} flex-1 ${result === true ? "border-emerald-500" : result === false ? "border-rose-500" : ""}`}
        />
        <Button type="submit" className="py-2.5">
          {result === null ? t.check : getMessages().common.next}
        </Button>
      </form>
      {result === true && <Alert tone="success">{t.correct}</Alert>}
      {result === false && (
        <Alert>
          {t.wrong} <strong lang="en">{card.word}</strong>
          {card.ipa ? ` ${card.ipa}` : ""}
        </Alert>
      )}
      {error && <Alert>{error}</Alert>}
      <p className="hidden text-center text-xs text-zinc-500 sm:block">{t.hint}</p>
    </div>
  );
}
