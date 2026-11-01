import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { requireActorRole } from "@/server/auth/session";
import { NotFoundError } from "@/server/dal/common";
import { getWord } from "@/server/dal/words";
import { PageHeader } from "@/components/ui";
import { WordForm } from "@/features/words/components/word-form";

export const metadata: Metadata = { title: getMessages().admin.word.edit };

export default async function EditWordPage({ params }: PageProps<"/admin/words/[id]">) {
  const { id } = await params;
  const actor = await requireActorRole("editor", routes.adminWord(id));
  const word = await getWord(actor, id).catch((err: unknown) => {
    if (err instanceof NotFoundError) notFound();
    throw err;
  });
  return (
    <>
      <PageHeader title={getMessages().admin.word.edit} />
      <WordForm id={word.id} initial={word} />
    </>
  );
}
