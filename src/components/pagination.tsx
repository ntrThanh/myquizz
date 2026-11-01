import Link from "next/link";
import { fmt, getMessages } from "@/lib/i18n";
import { buttonClass } from "@/components/ui";

export function Pagination({
  page,
  pageSize,
  total,
  href,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
}) {
  const t = getMessages().common;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-between gap-3 text-sm" aria-label="pagination">
      {page > 1 ? (
        <Link className={buttonClass("secondary")} href={href(page - 1)}>
          {t.prev}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-label-secondary tabular-nums">{fmt(t.page, { page, pages })}</span>
      {page < pages ? (
        <Link className={buttonClass("secondary")} href={href(page + 1)}>
          {t.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
