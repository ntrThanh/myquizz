import { getMessages } from "@/lib/i18n";

export function LoadingState() {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-zinc-500">
      <span className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
      {getMessages().common.loading}
    </div>
  );
}
