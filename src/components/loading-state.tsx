import { getMessages } from "@/lib/i18n";

export function LoadingState() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-label-secondary"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-fill-1 border-t-accent" />
      {getMessages().common.loading}
    </div>
  );
}
