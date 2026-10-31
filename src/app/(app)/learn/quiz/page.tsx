import type { Metadata } from "next";
import { getMessages } from "@/lib/i18n";
import { requireActor } from "@/server/auth/session";
import { getQuizQuestions } from "@/server/dal/study";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { QuizSession } from "@/features/study/components/quiz-session";

export const metadata: Metadata = { title: getMessages().quiz.title };

export default async function QuizPage() {
  const t = getMessages();
  const { questions, notEnoughWords } = await getQuizQuestions(
    await requireActor("/learn/quiz"),
    10,
  );
  return (
    <>
      <PageHeader title={t.quiz.title} />
      {questions.length === 0 ? (
        <EmptyState
          title={notEnoughWords ? t.quiz.notEnough : t.empty.noLearning}
          action={<ButtonLink href="/courses">{t.empty.goCourses}</ButtonLink>}
        />
      ) : (
        <QuizSession key={questions.map((q) => q.wordId).join()} questions={questions} />
      )}
    </>
  );
}
