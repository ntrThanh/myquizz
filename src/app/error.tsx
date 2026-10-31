"use client";

import { getMessages } from "@/lib/i18n";
import { Button, EmptyState } from "@/components/ui";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  const t = getMessages().common;
  return <EmptyState title={t.error} action={<Button onClick={() => retry()}>{t.retry}</Button>} />;
}
