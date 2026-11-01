import "server-only";
import { ObjectId } from "mongodb";
import { startOfDayPlus } from "@/lib/day";
import {
  DISTRACTOR_POOL_SIZE,
  type Direction,
  type PracticeMode,
  type PracticeSettings,
} from "@/lib/practice/config";
import {
  buildQuestions,
  modeNeedsPool,
  type Question,
  type VocabEntry,
} from "@/lib/practice/questions";
import { shuffle } from "@/lib/random";
import { INITIAL_SM2, qualityFromAnswer, review } from "@/lib/sm2";
import { computeStreak, retentionRate } from "@/lib/stats";
import { assertUser, type Actor } from "@/server/auth/roles";
import { getMongoClient } from "@/server/db/client";
import { collections, type WordDoc } from "@/server/db/collections";
import { NotFoundError, toObjectId } from "@/server/dal/common";

// Luyện tập trên toàn bộ từ vựng đã published. Tiến độ SM-2 của từng người được tạo ở lần trả lời
// đầu tiên. Mọi truy vấn tiến độ đều lọc theo actor.id lấy từ session.

const PUBLISHED = { status: "published" as const };

function toEntry(w: WordDoc): VocabEntry {
  return {
    wordId: w._id.toHexString(),
    word: w.word,
    meaningVi: w.meaningVi,
    ipa: w.ipa ?? null,
    example: w.example ?? null,
  };
}

function endOfToday(actor: Actor, now = new Date()) {
  return startOfDayPlus(now, 1, actor.timeZone);
}

/**
 * Chọn từ để luyện, theo thứ tự ưu tiên: từ đến hạn ôn → từ chưa học → từ đã học bất kỳ.
 * Từ đã bị chuyển về draft thì bỏ qua.
 */
async function pickWords(actor: Actor, count: number): Promise<WordDoc[]> {
  const userId = new ObjectId(actor.id);
  const picked: ObjectId[] = [];

  const due = await collections
    .userWordProgress()
    .find({ userId, dueDate: { $lt: endOfToday(actor) } }, { projection: { wordId: 1 } })
    .sort({ dueDate: 1, _id: 1 })
    .limit(count)
    .toArray();
  picked.push(...due.map((p) => p.wordId));

  if (picked.length < count) {
    const fresh = await collections
      .words()
      .aggregate<{ _id: ObjectId }>([
        { $match: { ...PUBLISHED, _id: { $nin: picked } } },
        {
          $lookup: {
            from: "userWordProgress",
            localField: "_id",
            foreignField: "wordId",
            pipeline: [{ $match: { userId } }, { $limit: 1 }, { $project: { _id: 1 } }],
            as: "progress",
          },
        },
        { $match: { progress: { $size: 0 } } },
        { $sample: { size: count - picked.length } },
        { $project: { _id: 1 } },
      ])
      .toArray();
    picked.push(...fresh.map((w) => w._id));
  }

  if (picked.length < count) {
    const learned = await collections
      .userWordProgress()
      .aggregate<{ wordId: ObjectId }>([
        { $match: { userId, wordId: { $nin: picked } } },
        { $sample: { size: count - picked.length } },
        { $project: { wordId: 1 } },
      ])
      .toArray();
    picked.push(...learned.map((p) => p.wordId));
  }

  if (picked.length === 0) return [];
  return collections
    .words()
    .find({ _id: { $in: picked }, ...PUBLISHED })
    .toArray();
}

async function distractorPool(): Promise<VocabEntry[]> {
  const words = await collections
    .words()
    .aggregate<WordDoc>([{ $match: PUBLISHED }, { $sample: { size: DISTRACTOR_POOL_SIZE } }])
    .toArray();
  return words.map(toEntry);
}

export type PracticeSession =
  | { status: "ready"; questions: Question[] }
  /** Hệ thống chưa có từ nào published. */
  | { status: "noWords" }
  /** Có từ nhưng không đủ để tạo phương án nhiễu cho trắc nghiệm. */
  | { status: "notEnoughWords" };

export async function getPracticeSession(
  actor: Actor | null,
  settings: PracticeSettings,
): Promise<PracticeSession> {
  assertUser(actor);
  const [words, pool] = await Promise.all([
    pickWords(actor, settings.count),
    modeNeedsPool(settings.mode) ? distractorPool() : Promise.resolve([]),
  ]);
  if (words.length === 0) return { status: "noWords" };

  const questions = buildQuestions(shuffle(words.map(toEntry)), settings, {
    pool,
    random: Math.random,
  });
  return questions.length > 0 ? { status: "ready", questions } : { status: "notEnoughWords" };
}

export interface AnswerInput {
  wordId: string;
  mode: PracticeMode;
  direction: Direction;
  correct: boolean;
}

/**
 * Ghi một câu trả lời: cập nhật SM-2 (đúng = Good, sai = Again) và thêm reviewLog trong cùng một
 * transaction. Lần đầu trả lời một từ thì tạo tiến độ mới.
 */
export async function recordAnswer(
  actor: Actor | null,
  input: AnswerInput,
): Promise<{ interval: number; dueDate: Date }> {
  assertUser(actor);
  const wordId = toObjectId(input.wordId, "Từ");
  const userId = new ObjectId(actor.id);
  const q = qualityFromAnswer(input.correct);
  const now = new Date();

  const session = getMongoClient().startSession();
  try {
    return await session.withTransaction(async () => {
      const word = await collections
        .words()
        .findOne({ _id: wordId, ...PUBLISHED }, { projection: { _id: 1 }, session });
      if (!word) throw new NotFoundError("Từ");

      const progress = await collections
        .userWordProgress()
        .findOne({ userId, wordId }, { session });
      const before = progress
        ? { n: progress.n, ef: progress.ef, interval: progress.interval }
        : INITIAL_SM2;
      const next = review(before, q, { now, timeZone: actor.timeZone });

      await collections.userWordProgress().updateOne(
        { userId, wordId },
        {
          $set: { ...next, lastReviewedAt: now, updatedAt: now },
          $setOnInsert: { _id: new ObjectId(), userId, wordId, createdAt: now },
        },
        { upsert: true, session },
      );
      await collections.reviewLogs().insertOne(
        {
          _id: new ObjectId(),
          userId,
          wordId,
          q,
          mode: input.mode,
          direction: input.direction,
          before,
          after: next,
          reviewedAt: now,
        },
        { session },
      );
      return { interval: next.interval, dueDate: next.dueDate };
    });
  } finally {
    await session.endSession();
  }
}

export interface PracticeStats {
  /** Số từ published trong hệ thống. */
  totalWords: number;
  /** Số từ người này đã từng trả lời. */
  learnedWords: number;
  dueToday: number;
  streak: number;
  /** Tỉ lệ trả lời đúng trong 7 ngày gần nhất (tính cả hôm nay); null nếu chưa có lượt nào. */
  accuracy7d: number | null;
  answers7d: number;
}

export async function getStats(actor: Actor | null): Promise<PracticeStats> {
  assertUser(actor);
  const userId = new ObjectId(actor.id);
  const now = new Date();
  const since7d = startOfDayPlus(now, -6, actor.timeZone);
  const since1y = startOfDayPlus(now, -366, actor.timeZone);

  const [totalWords, learnedWords, dueToday, days, week] = await Promise.all([
    collections.words().countDocuments(PUBLISHED),
    collections.userWordProgress().countDocuments({ userId }),
    collections
      .userWordProgress()
      .countDocuments({ userId, dueDate: { $lt: endOfToday(actor, now) } }),
    collections
      .reviewLogs()
      .aggregate<{ _id: string }>([
        { $match: { userId, reviewedAt: { $gte: since1y } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt", timezone: actor.timeZone },
            },
          },
        },
      ])
      .toArray(),
    collections
      .reviewLogs()
      .aggregate<{ total: number; correct: number }>([
        { $match: { userId, reviewedAt: { $gte: since7d } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            correct: { $sum: { $cond: [{ $gte: ["$q", 3] }, 1, 0] } },
          },
        },
      ])
      .toArray(),
  ]);

  const w = week[0] ?? { total: 0, correct: 0 };
  return {
    totalWords,
    learnedWords,
    dueToday,
    streak: computeStreak(
      days.map((d) => d._id),
      now,
      actor.timeZone,
    ),
    accuracy7d: retentionRate(w.correct, w.total),
    answers7d: w.total,
  };
}
