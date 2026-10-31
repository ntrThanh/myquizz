import type { Metadata } from "next";
import { getMessages } from "@/lib/i18n";
import { requireActor } from "@/server/auth/session";
import { getDueCards } from "@/server/dal/study";
import { PageHeader } from "@/components/ui";
import { FlashcardSession } from "@/features/study/components/flashcard-session";

export const metadata: Metadata = { title: getMessages().review.title };

export default async function ReviewPage() {
  const { cards, totalDue } = await getDueCards(await requireActor("/learn/review"));
  return (
    <>
      <PageHeader title={getMessages().review.title} />
      {/* key: phiên mới mỗi lần server trả về danh sách mới (sau "Ôn tiếp") */}
      <FlashcardSession key={cards.map((c) => c.wordId).join()} cards={cards} totalDue={totalDue} />
    </>
  );
}
