import type { Metadata } from "next";
import { getMessages } from "@/lib/i18n";
import { requireActor } from "@/server/auth/session";
import { getTypingCards } from "@/server/dal/study";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { TypingSession } from "@/features/study/components/typing-session";

export const metadata: Metadata = { title: getMessages().typing.title };

export default async function TypingPage() {
  const t = getMessages();
  const cards = await getTypingCards(await requireActor("/learn/typing"), 10);
  return (
    <>
      <PageHeader title={t.typing.title} />
      {cards.length === 0 ? (
        <EmptyState
          title={t.empty.noLearning}
          action={<ButtonLink href="/courses">{t.empty.goCourses}</ButtonLink>}
        />
      ) : (
        <TypingSession key={cards.map((c) => c.wordId).join()} cards={cards} />
      )}
    </>
  );
}
