import { getMessages } from "@/lib/i18n";
import type { Question } from "@/lib/practice/questions";
import { Card } from "@/components/ui";

/** Đề bài: câu hỏi theo chiều hỏi và từ/nghĩa cần trả lời. */
export function PromptCard({ question }: { question: Question }) {
  const t = getMessages().practice;
  return (
    <Card className="animate-rise flex min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <p className="text-sm font-medium text-label-secondary">{t.ask[question.direction]}</p>
      <p
        className="text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl"
        lang={question.promptLang}
      >
        {question.prompt}
      </p>
      {question.promptLang === "en" && question.ipa && (
        <p className="text-lg text-label-secondary">{question.ipa}</p>
      )}
    </Card>
  );
}
