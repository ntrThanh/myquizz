"use client";

import { useState } from "react";
import { getMessages } from "@/lib/i18n";
import type { TypingQuestion } from "@/lib/practice/questions";
import { Button, inputClass } from "@/components/ui";
import type { AnswerViewProps } from "@/features/practice/components/types";

const t = getMessages().practice;

export function TypingAnswer({ question, result, onSubmit }: AnswerViewProps<TypingQuestion>) {
  const [value, setValue] = useState("");
  const tone = result === null ? "" : result.correct ? "border-emerald-500" : "border-rose-500";

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (result === null && value.trim()) onSubmit(value);
      }}
    >
      <label className="sr-only" htmlFor="typing-answer">
        {t.placeholder[question.answerLang]}
      </label>
      <input
        id="typing-answer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={result !== null}
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        lang={question.answerLang}
        placeholder={t.placeholder[question.answerLang]}
        className={`${inputClass} flex-1 ${tone}`}
      />
      {result === null && (
        <Button type="submit" className="py-2.5">
          {t.check}
        </Button>
      )}
    </form>
  );
}
