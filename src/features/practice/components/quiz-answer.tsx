"use client";

import type { QuizQuestion } from "@/lib/practice/questions";
import type { AnswerViewProps } from "@/features/practice/components/types";
import { useHotkeys } from "@/features/practice/components/use-hotkeys";

const STATE_CLASS = {
  idle: "border-zinc-300 bg-white hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500",
  correct:
    "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100",
  wrong:
    "border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-100",
  dimmed:
    "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
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
    <div className="grid gap-2 sm:grid-cols-2">
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
            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${STATE_CLASS[state]}`}
          >
            <kbd className="text-xs opacity-60">{i + 1}</kbd>
            <span className="flex-1">{option}</span>
            {MARK[state] && (
              <span aria-hidden className="font-bold">
                {MARK[state]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
