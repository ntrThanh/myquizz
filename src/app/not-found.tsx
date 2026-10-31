import { getMessages } from "@/lib/i18n";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  const t = getMessages().common;
  return <EmptyState title={t.notFound} action={<ButtonLink href="/">{t.home}</ButtonLink>} />;
}
