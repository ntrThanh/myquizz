import { fmt, getMessages } from "@/lib/i18n";
import type { Topic } from "@/lib/topics";

/** Tên bài hiển thị, ví dụ "Công việc 2". */
export function lessonName(topic: Topic, lesson: number): string {
  const m = getMessages();
  return fmt(m.practice.lessonName, { topic: m.topics[topic], number: lesson });
}
