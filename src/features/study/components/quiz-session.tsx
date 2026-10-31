"use client";

import { useState } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { qualityFromAnswer } from "@/lib/sm2";
import type { QuizQuestion, StudyCard } from "@/server/dal/study";
import { Alert, Button, Card } from "@/components/ui";
import { submitReviewAction } from "@/features/study/actions";
import { SessionResult } from "@/features/study/components/session-result";
import { useHotkeys } from "@/features/study/components/use-hotkeys";
import { WordFace } from "@/features/study/components/word-face";

const t = getMessages().quiz;

export function QuizSession({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [wrong, setWrong] = useState<StudyCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const q = questions[index];

  function choose(option: string) {
    if (!q || chosen !== null) return;
    setChosen(option);
    const correct = option === q.meaningVi;
    if (!correct) setWrong((w) => [...w, q]);
    // Hiện kết quả ngay, ghi SM-2 ở nền; lỗi thì báo nhưng không chặn phiên.
    submitReviewAction({ mode: "quiz", wordId: q.wordId, q: qualityFromAnswer(correct) }).then(
      (res) => {
        if (!res.ok) setError(res.error);
      },
    );
  }

  function next() {
    if (chosen === null) return;
    setChosen(null);
    setIndex((i) => i + 1);
  }

  useHotkeys((key, e) => {
    if (!q) return;
    const n = Number(key);
    if (n >= 1 && n <= q.options.length) choose(q.options[n - 1]!);
    else if (key === "Enter" || key === " ") {
      e.preventDefault();
      next();
    }
  });

  if (!q) {
    return (
      <SessionResult
        total={questions.length}
        wrong={wrong}
        onRestart={() => {
          setIndex(0);
          setChosen(null);
          setWrong([]);
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {fmt(t.progress, { current: index + 1, total: questions.length })}
      </p>
      <Card className="flex flex-col items-center gap-2 p-8">
        <WordFace card={q} />
        <p className="text-sm text-zinc-500">{t.question}</p>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const isAnswer = o === q.meaningVi;
          const state =
            chosen === null
              ? "border-zinc-300 bg-white hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500"
              : isAnswer
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100"
                : o === chosen
                  ? "border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-100"
                  : "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500";
          const mark = chosen === null ? null : isAnswer ? "✓" : o === chosen ? "✗" : null;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              // Không dùng `disabled` (trình duyệt làm nhạt màu); choose() tự bỏ qua sau khi đã chọn.
              aria-disabled={chosen !== null}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${state}`}
            >
              <kbd className="text-xs opacity-60">{i + 1}</kbd>
              <span className="flex-1">{o}</span>
              {mark && (
                <span aria-hidden className="font-bold">
                  {mark}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {chosen === q.meaningVi ? (
            <Alert tone="success">{t.correct}</Alert>
          ) : (
            <Alert>
              {t.wrong} <strong>{q.meaningVi}</strong>
            </Alert>
          )}
          <Button onClick={next} autoFocus>
            {getMessages().common.next}
          </Button>
        </div>
      )}
      {error && <Alert>{error}</Alert>}
      <p className="hidden text-center text-xs text-zinc-500 sm:block">{t.hint}</p>
    </div>
  );
}
