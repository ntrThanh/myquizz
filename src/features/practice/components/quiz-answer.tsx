"use client";

import type { QuizQuestion } from "@/lib/practice/questions";
import type { AnswerViewProps } from "@/features/practice/components/types";
import { useHotkeys } from "@/features/practice/components/use-hotkeys";

const STATE_CLASS = {
  idle: "glass-thin hover:-translate-y-0.5 hover:outline-accent/40",
  correct: "animate-pop bg-success/15 text-success-ink outline-success",
  wrong: "animate-shake bg-danger/12 text-danger-ink outline-danger",
  dimmed: "bg-fill-4 text-label-tertiary",
} as const;

const MARK = { idle: null, correct: "✓", wrong: "✗", dimmed: null } as const;

export function QuizAnswer({ question, result, onSubmit }: AnswerViewProps<QuizQuestion>) {
  function choose(option: string) {
    if (result === null) onSubmit(option);
  }

  // Phím 1..n chọn phương án tương ứng.
  useHotkeys((key) => {
    const n = Number(key);
    if (Number.isInteger(n) && n >= 1 && n <= question.options.length) {
      choose(question.options[n - 1]!);
    }
  });

  return (
    <div className="stagger grid gap-3 sm:grid-cols-2">
      {question.options.map((option, i) => {
        const state =
          result === null
            ? "idle"
            : option === question.answer
              ? "correct"
              : option === result.given
                ? "wrong"
                : "dimmed";
        return (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            // Không dùng `disabled` (trình duyệt làm nhạt màu); choose() tự bỏ qua sau khi đã chọn.
            aria-disabled={result !== null}
            lang={question.answerLang}
            className={`press flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium outline-2 outline-transparent -outline-offset-2 duration-300 ease-apple-out focus-visible:outline-accent ${STATE_CLASS[state]}`}
          >
            <kbd className="grid size-6 shrink-0 place-items-center rounded-lg bg-fill-3 font-sans text-xs font-semibold text-label-secondary">
              {i + 1}
            </kbd>
            <span className="flex-1">{option}</span>
            {MARK[state] && (
              <span aria-hidden className="animate-pop text-lg font-bold">
                {MARK[state]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
