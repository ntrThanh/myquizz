"use client";

import { QuizAnswer } from "@/features/practice/components/quiz-answer";
import { TypingAnswer } from "@/features/practice/components/typing-answer";
import type { AnswerViewProps } from "@/features/practice/components/types";

/**
 * Chọn component nhập đáp án theo chế độ. Thêm chế độ mới = thêm một `case`; TypeScript báo lỗi
 * nếu thiếu (hàm phải trả về giá trị cho mọi `mode`).
 */
export function AnswerView({ question, ...rest }: AnswerViewProps) {
  switch (question.mode) {
    case "typing":
      return <TypingAnswer question={question} {...rest} />;
    case "quiz":
      return <QuizAnswer question={question} {...rest} />;
  }
}
