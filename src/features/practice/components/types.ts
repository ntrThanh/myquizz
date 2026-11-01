import type { Question } from "@/lib/practice/questions";

export interface AnswerResult {
  correct: boolean;
  /** Đáp án người học đã gõ hoặc chọn. */
  given: string;
}

/** Props chung của mọi kiểu nhập đáp án (gõ, trắc nghiệm…). */
export interface AnswerViewProps<Q extends Question = Question> {
  question: Q;
  /** null khi chưa trả lời. */
  result: AnswerResult | null;
  onSubmit: (given: string) => void;
}
