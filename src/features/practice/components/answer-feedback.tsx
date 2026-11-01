import { getMessages } from "@/lib/i18n";
import type { Question } from "@/lib/practice/questions";
import { Alert } from "@/components/ui";
import type { AnswerResult } from "@/features/practice/components/types";

/** Kết quả sau khi trả lời: đúng/sai, đáp án, và thông tin thêm về từ. */
export function AnswerFeedback({ question, result }: { question: Question; result: AnswerResult }) {
  const t = getMessages().practice;
  return (
    <div className="flex flex-col gap-2">
      {result.correct ? (
        <Alert tone="success">{t.correct}</Alert>
      ) : (
        <Alert>
          {t.wrong} <strong lang={question.answerLang}>{question.answer}</strong>
        </Alert>
      )}
      {(question.ipa || question.example) && (
        <p
          className="animate-rise px-1 text-sm text-label-secondary [animation-delay:80ms]"
          lang="en"
        >
          <strong className="text-label">{question.word}</strong>
          {question.ipa && ` ${question.ipa}`}
          {question.example && <em className="block">{question.example}</em>}
        </p>
      )}
    </div>
  );
}
