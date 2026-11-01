import { isCorrectAnswer, normalizeAnswer } from "@/lib/practice/answer";
import {
  DIRECTIONS,
  QUIZ_OPTION_COUNT,
  type Direction,
  type DirectionSetting,
  type PracticeMode,
} from "@/lib/practice/config";
import { pick, shuffle, type Random } from "@/lib/random";

// Tạo câu hỏi từ danh sách từ. Hàm thuần: không đụng UI hay DB.
// Mỗi chế độ là một strategy trong STRATEGIES; thêm chế độ mới = thêm một mục, không sửa chỗ khác.

export type Lang = "en" | "vi";

/** Một mục từ vựng ở dạng gửi được xuống client. */
export interface VocabEntry {
  wordId: string;
  word: string;
  meaningVi: string;
  ipa: string | null;
  example: string | null;
}

interface Side {
  lang: Lang;
  text: (e: VocabEntry) => string;
}

const english: Side = { lang: "en", text: (e) => e.word };
const vietnamese: Side = { lang: "vi", text: (e) => e.meaningVi };

const SIDES: Record<Direction, { prompt: Side; answer: Side }> = {
  "en-vi": { prompt: english, answer: vietnamese },
  "vi-en": { prompt: vietnamese, answer: english },
};

interface BaseQuestion {
  wordId: string;
  direction: Direction;
  prompt: string;
  promptLang: Lang;
  answer: string;
  answerLang: Lang;
  /** Thông tin thêm về từ tiếng Anh, hiện khi xem đáp án. */
  word: string;
  ipa: string | null;
  example: string | null;
}

export interface TypingQuestion extends BaseQuestion {
  mode: "typing";
}

export interface QuizQuestion extends BaseQuestion {
  mode: "quiz";
  /** Các phương án đã xáo trộn, có đúng một phương án bằng `answer`. */
  options: string[];
}

export type Question = TypingQuestion | QuizQuestion;
export type QuestionOf<M extends PracticeMode> = Extract<Question, { mode: M }>;

export interface BuildContext {
  /** Kho từ để lấy phương án nhiễu; chỉ chế độ có `needsPool` mới dùng. */
  pool: readonly VocabEntry[];
  random: Random;
}

interface ModeStrategy<M extends PracticeMode> {
  needsPool: boolean;
  /** null khi không tạo được câu (ví dụ thiếu phương án nhiễu). */
  build(base: BaseQuestion, entry: VocabEntry, ctx: BuildContext): QuestionOf<M> | null;
  isCorrect(question: QuestionOf<M>, given: string): boolean;
}

function quizOptions(base: BaseQuestion, entry: VocabEntry, ctx: BuildContext): string[] | null {
  const answerSide = SIDES[base.direction].answer;
  const seen = new Set([normalizeAnswer(base.answer)]);
  const distractors: string[] = [];
  for (const other of shuffle(ctx.pool, ctx.random)) {
    if (distractors.length === QUIZ_OPTION_COUNT - 1) break;
    if (other.wordId === entry.wordId) continue;
    const text = answerSide.text(other);
    const key = normalizeAnswer(text);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(text);
  }
  if (distractors.length < QUIZ_OPTION_COUNT - 1) return null;
  return shuffle([base.answer, ...distractors], ctx.random);
}

const STRATEGIES: { [M in PracticeMode]: ModeStrategy<M> } = {
  typing: {
    needsPool: false,
    build: (base) => ({ ...base, mode: "typing" }),
    isCorrect: (q, given) => isCorrectAnswer(given, q.answer),
  },
  quiz: {
    needsPool: true,
    build(base, entry, ctx) {
      const options = quizOptions(base, entry, ctx);
      return options && { ...base, mode: "quiz", options };
    },
    // Phương án do server tạo nên so sánh nguyên văn.
    isCorrect: (q, given) => given === q.answer,
  },
};

export function modeNeedsPool(mode: PracticeMode): boolean {
  return STRATEGIES[mode].needsPool;
}

export function resolveDirection(setting: DirectionSetting, random: Random): Direction {
  return setting === "mixed" ? pick(DIRECTIONS, random) : setting;
}

function baseQuestion(entry: VocabEntry, direction: Direction): BaseQuestion {
  const { prompt, answer } = SIDES[direction];
  return {
    wordId: entry.wordId,
    direction,
    prompt: prompt.text(entry),
    promptLang: prompt.lang,
    answer: answer.text(entry),
    answerLang: answer.lang,
    word: entry.word,
    ipa: entry.ipa,
    example: entry.example,
  };
}

function buildOne<M extends PracticeMode>(
  mode: M,
  entry: VocabEntry,
  direction: DirectionSetting,
  ctx: BuildContext,
): QuestionOf<M> | null {
  return STRATEGIES[mode].build(
    baseQuestion(entry, resolveDirection(direction, ctx.random)),
    entry,
    ctx,
  );
}

/** Một câu cho mỗi từ; từ không tạo được câu thì bỏ qua. */
export function buildQuestions(
  entries: readonly VocabEntry[],
  settings: { mode: PracticeMode; direction: DirectionSetting },
  ctx: BuildContext,
): Question[] {
  return entries.flatMap((e) => buildOne(settings.mode, e, settings.direction, ctx) ?? []);
}

export function checkAnswer<M extends PracticeMode>(
  question: QuestionOf<M>,
  given: string,
): boolean {
  return STRATEGIES[question.mode as M].isCorrect(question, given);
}
