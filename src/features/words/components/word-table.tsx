"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import type { Topic } from "@/lib/topics";
import type { ContentStatus } from "@/lib/types";
import { Alert, Badge, Button } from "@/components/ui";
import { setWordsStatusAction } from "@/features/words/actions";

const t = getMessages().admin.word;
const topicLabels = getMessages().topics;

export interface WordTableRow {
  id: string;
  word: string;
  ipa: string;
  meaningVi: string;
  topic: Topic;
  status: ContentStatus;
  /** Đã định dạng theo múi giờ của người xem ở server. */
  updated: string;
}

type Message = { tone: "error" | "success"; text: string };

/** Bảng từ trong trang quản trị; chọn nhiều dòng để đăng hoặc chuyển về nháp một lượt. */
export function WordTable({ rows }: { rows: WordTableRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState<Message | null>(null);
  const [pending, start] = useTransition();

  // Trang đổi (phân trang, lọc) thì bỏ các id không còn hiển thị.
  const visible = selected.size > 0 ? rows.filter((r) => selected.has(r.id)).map((r) => r.id) : [];
  const allChecked = rows.length > 0 && visible.length === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function setStatus(status: ContentStatus) {
    setMessage(null);
    start(async () => {
      const res = await setWordsStatusAction({ ids: visible, status });
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error });
        return;
      }
      setSelected(new Set());
      setMessage({ tone: "success", text: fmt(t.bulkDone, { count: res.data.changed }) });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-10 flex-wrap items-center gap-3">
        <span className="text-sm text-label-secondary" aria-live="polite">
          {fmt(t.selected, { count: visible.length })}
        </span>
        <Button
          type="button"
          disabled={pending || visible.length === 0}
          onClick={() => setStatus("published")}
        >
          {t.publishSelected}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || visible.length === 0}
          onClick={() => setStatus("draft")}
        >
          {t.draftSelected}
        </Button>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="overflow-x-auto glass rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-fill-4 text-xs text-label-secondary uppercase tracking-wide">
            <tr>
              <th className="w-10 px-4 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label={t.selectAll}
                  className="size-4 accent-accent"
                />
              </th>
              <th className="px-4 py-2">{t.word}</th>
              <th className="px-4 py-2">{t.meaningVi}</th>
              <th className="px-4 py-2">{t.colTopic}</th>
              <th className="px-4 py-2">{t.status}</th>
              <th className="px-4 py-2">{t.colUpdated}</th>
              <th className="px-4 py-2">
                <span className="sr-only">{t.editLink}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(w.id)}
                    onChange={() => toggle(w.id)}
                    aria-label={`${t.select}: ${w.word}`}
                    className="size-4 accent-accent"
                  />
                </td>
                <td className="px-4 py-2 font-medium" lang="en">
                  {w.word}
                  {w.ipa && <span className="ml-2 font-normal text-label-secondary">{w.ipa}</span>}
                </td>
                <td className="max-w-md px-4 py-2">{w.meaningVi}</td>
                <td className="px-4 py-2 whitespace-nowrap text-label-secondary">
                  {topicLabels[w.topic]}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={w.status === "draft" ? "amber" : "indigo"}>
                    {t.statuses[w.status]}
                  </Badge>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-label-secondary">{w.updated}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={routes.adminWord(w.id)}
                    className="font-semibold text-accent hover:underline"
                  >
                    {t.editLink}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
