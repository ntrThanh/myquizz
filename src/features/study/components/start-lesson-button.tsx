"use client";

import { useState, useTransition } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { Button } from "@/components/ui";
import { startLessonAction } from "@/features/study/actions";

const t = getMessages().courses;

export function StartLessonButton({
  lessonId,
  courseSlug,
  done,
}: {
  lessonId: string;
  courseSlug: string;
  done: boolean;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={done ? "secondary" : "primary"}
        disabled={pending || done}
        onClick={() =>
          start(async () => {
            const res = await startLessonAction({ lessonId, courseSlug });
            if (!res.ok) setMessage({ text: res.error, error: true });
            else
              setMessage({
                text: res.data.added > 0 ? fmt(t.added, { count: res.data.added }) : t.noNewWords,
              });
          })
        }
      >
        {done ? t.started : t.start}
      </Button>
      {message && (
        <span
          role="status"
          className={`text-xs ${message.error ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
