"use client";

import { useState } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { QUIZ_OPTION_COUNT } from "@/lib/practice/config";
import { checkAnswer, type Question } from "@/lib/practice/questions";
import { Alert, Button } from "@/components/ui";
import { recordAnswerAction } from "@/features/practice/actions";
import { AnswerFeedback } from "@/features/practice/components/answer-feedback";
import { AnswerView } from "@/features/practice/components/answer-view";
import { PromptCard } from "@/features/practice/components/prompt-card";
import { SessionResult } from "@/features/practice/components/session-result";
import type { AnswerResult } from "@/features/practice/components/types";

const t = getMessages().practice;

/** Một lượt luyện: hỏi lần lượt từng câu, chấm, lưu tiến độ ở nền, rồi hiện kết quả. */
export function PracticeSession({
  questions,
  settingsHref,
}: {
  questions: Question[];
  settingsHref: string;
}) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [wrong, setWrong] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const question = questions[index];
  const answered = index + (result ? 1 : 0);

  if (!question) {
    return (
      <SessionResult
        total={questions.length}
        wrong={wrong}
        settingsHref={settingsHref}
        onRestart={() => {
          setIndex(0);
          setResult(null);
          setWrong([]);
          setError(null);
        }}
      />
    );
  }

  function submit(given: string) {
    if (!question || result !== null) return;
    const correct = checkAnswer(question, given);
    setResult({ correct, given });
    if (!correct) setWrong((w) => [...w, question]);
    // Hiện kết quả ngay, lưu SM-2 ở nền; lỗi thì báo nhưng không chặn lượt luyện.
    recordAnswerAction({
      wordId: question.wordId,
      mode: question.mode,
      direction: question.direction,
      correct,
    }).then((res) => {
      if (!res.ok) setError(res.error);
    });
  }

  function next() {
    setResult(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answered}
          aria-label={fmt(t.progress, { current: index + 1, total: questions.length })}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-3"
        >
          <div
            className="h-full origin-left rounded-full bg-accent transition-transform duration-700 ease-apple-out"
            style={{ transform: `scaleX(${answered / questions.length})` }}
          />
        </div>
        <p className="text-sm font-medium text-label-secondary tabular-nums">
          {fmt(t.progress, { current: index + 1, total: questions.length })}
        </p>
      </div>
      {/* key: hiệu ứng xuất hiện chạy lại cho mỗi câu. */}
      <PromptCard key={`prompt-${index}`} question={question} />
      {/* key: mỗi câu một component mới để reset ô nhập và tự focus. */}
      <AnswerView key={`answer-${index}`} question={question} result={result} onSubmit={submit} />
      {result && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <AnswerFeedback question={question} result={result} />
          <Button onClick={next} autoFocus className="animate-rise px-6">
            {getMessages().common.next}
          </Button>
        </div>
      )}
      {error && <Alert>{error}</Alert>}
      <p className="hidden text-center text-xs text-label-tertiary sm:block">
        {fmt(t.hint[question.mode], { count: QUIZ_OPTION_COUNT })}
      </p>
    </div>
  );
}
