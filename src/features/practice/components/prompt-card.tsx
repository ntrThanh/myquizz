import { getMessages } from "@/lib/i18n";
import type { Question } from "@/lib/practice/questions";
import { Card } from "@/components/ui";

/** Đề bài: câu hỏi theo chiều hỏi và từ/nghĩa cần trả lời. */
export function PromptCard({ question }: { question: Question }) {
  const t = getMessages().practice;
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="text-sm text-zinc-500">{t.ask[question.direction]}</p>
      <p className="text-3xl font-semibold tracking-tight sm:text-4xl" lang={question.promptLang}>
        {question.prompt}
      </p>
      {question.promptLang === "en" && question.ipa && (
        <p className="text-zinc-500">{question.ipa}</p>
      )}
    </Card>
  );
}
