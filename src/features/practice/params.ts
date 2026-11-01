import { notFound } from "next/navigation";
import { TOPICS, type Topic } from "@/lib/topics";

// Đọc tham số động trên URL của trang chủ đề/bài; giá trị sai thì trả 404.

export function findTopic(value: string): Topic | undefined {
  return TOPICS.find((t) => t === value);
}

export function parseTopicParam(value: string): Topic {
  const topic = findTopic(value);
  if (!topic) notFound();
  return topic;
}

export function parseLessonParam(value: string): number {
  const lesson = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(lesson) || lesson < 1) notFound();
  return lesson;
}
