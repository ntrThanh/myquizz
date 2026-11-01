import type { Metadata } from "next";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActorRole } from "@/server/auth/session";
import { PageHeader } from "@/components/ui";
import { WordForm } from "@/features/words/components/word-form";

export const metadata: Metadata = { title: getMessages().admin.word.new };

export default async function NewWordPage() {
  await requireActorRole("editor", routes.adminNewWord);
  return (
    <>
      <PageHeader title={getMessages().admin.word.new} />
      <WordForm />
    </>
  );
}
