import "server-only";
import { ObjectId, type Document, type Filter } from "mongodb";
import { startOfDayPlus } from "@/lib/day";
import {
  DISTRACTOR_POOL_SIZE,
  type Direction,
  type PracticeMode,
  type PracticeSettings,
  type TopicSetting,
} from "@/lib/practice/config";
import {
  buildQuestions,
  modeNeedsPool,
  type Question,
  type VocabEntry,
} from "@/lib/practice/questions";
import { countPerLesson, lessonCount, lessonSlice } from "@/lib/practice/lessons";
import { shuffle } from "@/lib/random";
import { TOPICS, type Topic } from "@/lib/topics";
import { INITIAL_SM2, qualityFromAnswer, review } from "@/lib/sm2";
import { computeStreak, retentionRate } from "@/lib/stats";
import { assertUser, type Actor } from "@/server/auth/roles";
import { getMongoClient } from "@/server/db/client";
import { collections, type WordDoc } from "@/server/db/collections";
import { NotFoundError, toObjectId } from "@/server/dal/common";

// Luyện tập trên từ vựng đã published: mọi chủ đề, một chủ đề, hoặc một bài trong chủ đề. Tiến độ
// SM-2 của từng người được tạo ở lần trả lời đầu tiên. Mọi truy vấn tiến độ đều lọc theo actor.id
// lấy từ session.
//
// Một từ tính là "đã thuộc" khi lần trả lời gần nhất đúng (SM-2 `n >= 1`).

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

function wordFilter(topic: TopicSetting): Filter<WordDoc> {
  return topic === "all" ? PUBLISHED : { ...PUBLISHED, topics: topic };
}

/** Chỉ giữ tiến độ của những từ còn khớp bộ lọc (published, đúng chủ đề). */
function onlyMatchingWords(filter: Filter<WordDoc>): Document[] {
  return [
    {
      $lookup: {
        from: "words",
        localField: "wordId",
        foreignField: "_id",
        pipeline: [{ $match: filter }, { $project: { _id: 1 } }],
        as: "word",
      },
    },
    { $match: { word: { $ne: [] } } },
  ];
}

/**
 * Lấy mẫu số từ gấp bao nhiêu lần số cần để tìm từ chưa học. Tránh `$lookup` trên toàn bộ kho từ
 * (có thể hàng trăm nghìn từ); kho nhỏ hơn cỡ mẫu thì `$sample` trả về tất cả nên vẫn chính xác.
 */
const FRESH_SAMPLE_FACTOR = 10;

const LEARNED = { n: { $gte: 1 } };

/** Thứ tự cho từ chưa có `topicRanks` (thêm tay): xếp sau mọi từ có thứ tự. */
const UNRANKED = Number.MAX_SAFE_INTEGER;

/** Id các từ published của chủ đề, theo thứ tự học (`topicRanks`, rồi thời gian tạo). */
async function topicWordIds(topic: Topic): Promise<ObjectId[]> {
  const docs = await collections
    .words()
    .aggregate<{ _id: ObjectId }>([
      { $match: { ...PUBLISHED, topics: topic } },
      { $addFields: { rank: { $ifNull: [`$topicRanks.${topic}`, UNRANKED] } } },
      { $sort: { rank: 1, _id: 1 } },
      { $project: { _id: 1 } },
    ])
    .toArray();
  return docs.map((d) => d._id);
}

/** Trong `wordIds`, những từ người này đã thuộc. */
async function learnedAmong(userId: ObjectId, wordIds: ObjectId[]): Promise<Set<string>> {
  if (wordIds.length === 0) return new Set();
  const docs = await collections
    .userWordProgress()
    .find({ userId, wordId: { $in: wordIds }, ...LEARNED }, { projection: { wordId: 1 } })
    .toArray();
  return new Set(docs.map((d) => d.wordId.toHexString()));
}

/** Bộ lọc từ cho một lượt luyện: theo bài nếu có, không thì theo chủ đề. */
async function practiceFilter(settings: PracticeSettings): Promise<Filter<WordDoc>> {
  if (settings.topic === "all" || settings.lesson === null) return wordFilter(settings.topic);
  const ids = lessonSlice(await topicWordIds(settings.topic), settings.lesson);
  return { ...PUBLISHED, _id: { $in: ids } };
}

/**
 * Chọn từ để luyện, theo thứ tự ưu tiên: từ đến hạn ôn → từ chưa học → từ đã học bất kỳ.
 * Chỉ lấy từ khớp `filter` (published, đúng chủ đề/bài).
 */
async function pickWords(actor: Actor, count: number, filter: Filter<WordDoc>): Promise<WordDoc[]> {
  const userId = new ObjectId(actor.id);
  const picked: ObjectId[] = [];

  const due = await collections
    .userWordProgress()
    .aggregate<{ wordId: ObjectId }>([
      { $match: { userId, dueDate: { $lt: endOfToday(actor) } } },
      { $sort: { dueDate: 1, _id: 1 } },
      ...onlyMatchingWords(filter),
      { $limit: count },
      { $project: { wordId: 1 } },
    ])
    .toArray();
  picked.push(...due.map((p) => p.wordId));

  if (picked.length < count) {
    const need = count - picked.length;
    const fresh = await collections
      .words()
      .aggregate<{ _id: ObjectId }>([
        // $and (không spread) để không ghi đè điều kiện `_id` của bộ lọc theo bài.
        { $match: { $and: [filter, { _id: { $nin: picked } }] } },
        { $sample: { size: need * FRESH_SAMPLE_FACTOR } },
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
        { $limit: need },
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
        ...onlyMatchingWords(filter),
        { $sample: { size: count - picked.length } },
        { $project: { wordId: 1 } },
      ])
      .toArray();
    picked.push(...learned.map((p) => p.wordId));
  }

  if (picked.length === 0) return [];
  return collections
    .words()
    .find({ $and: [filter, { _id: { $in: picked } }] })
    .toArray();
}

/** Phương án nhiễu lấy cùng chủ đề để câu hỏi không quá dễ đoán. */
async function distractorPool(topic: TopicSetting): Promise<VocabEntry[]> {
  const words = await collections
    .words()
    .aggregate<WordDoc>([
      { $match: wordFilter(topic) },
      { $sample: { size: DISTRACTOR_POOL_SIZE } },
    ])
    .toArray();
  return words.map(toEntry);
}

export interface TopicProgress {
  topic: Topic;
  /** Số từ published của chủ đề. */
  total: number;
  /** Số từ trong đó người này đã thuộc. */
  learned: number;
  lessons: number;
}

/**
 * Các chủ đề đang có từ published (theo thứ tự trong TOPICS), kèm số từ, số bài và tiến độ của
 * người xem. Một từ thuộc nhiều chủ đề được đếm ở mỗi chủ đề.
 */
export async function listTopicProgress(actor: Actor | null): Promise<TopicProgress[]> {
  assertUser(actor);
  const userId = new ObjectId(actor.id);
  const [totals, learned] = await Promise.all([
    collections
      .words()
      .aggregate<{ _id: Topic; count: number }>([
        { $match: PUBLISHED },
        { $unwind: "$topics" },
        { $group: { _id: "$topics", count: { $sum: 1 } } },
      ])
      .toArray(),
    collections
      .userWordProgress()
      .aggregate<{ _id: Topic; count: number }>([
        { $match: { userId, ...LEARNED } },
        {
          $lookup: {
            from: "words",
            localField: "wordId",
            foreignField: "_id",
            pipeline: [{ $match: PUBLISHED }, { $project: { topics: 1 } }],
            as: "word",
          },
        },
        { $unwind: "$word" },
        { $unwind: "$word.topics" },
        { $group: { _id: "$word.topics", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);
  const totalBy = new Map(totals.map((g) => [g._id, g.count]));
  const learnedBy = new Map(learned.map((g) => [g._id, g.count]));
  return TOPICS.flatMap((topic) => {
    const total = totalBy.get(topic);
    if (!total) return [];
    return [{ topic, total, learned: learnedBy.get(topic) ?? 0, lessons: lessonCount(total) }];
  });
}

export interface LessonProgress {
  lesson: number;
  total: number;
  learned: number;
}

/** Các bài của một chủ đề kèm tiến độ của người xem. Chủ đề chưa có từ published thì rỗng. */
export async function listTopicLessons(
  actor: Actor | null,
  topic: Topic,
): Promise<LessonProgress[]> {
  assertUser(actor);
  const ids = await topicWordIds(topic);
  const learned = await learnedAmong(new ObjectId(actor.id), ids);
  return countPerLesson(ids, (id) => learned.has(id.toHexString())).map((c, i) => ({
    lesson: i + 1,
    total: c.total,
    learned: c.matched,
  }));
}

export interface LessonWord {
  id: string;
  word: string;
  meaningVi: string;
  ipa: string | null;
  learned: boolean;
}

/** Danh sách từ của một bài (theo thứ tự học); bài không tồn tại thì báo NotFound. */
export async function getLessonWords(
  actor: Actor | null,
  topic: Topic,
  lesson: number,
): Promise<LessonWord[]> {
  assertUser(actor);
  const ids = lessonSlice(await topicWordIds(topic), lesson);
  if (ids.length === 0) throw new NotFoundError("Bài");
  const [docs, learned] = await Promise.all([
    collections
      .words()
      .find({ _id: { $in: ids } })
      .toArray(),
    learnedAmong(new ObjectId(actor.id), ids),
  ]);
  const byId = new Map(docs.map((w) => [w._id.toHexString(), w]));
  return ids.flatMap((oid) => {
    const w = byId.get(oid.toHexString());
    if (!w) return [];
    return [
      {
        id: w._id.toHexString(),
        word: w.word,
        meaningVi: w.meaningVi,
        ipa: w.ipa ?? null,
        learned: learned.has(w._id.toHexString()),
      },
    ];
  });
}

export type PracticeSession =
  | { status: "ready"; questions: Question[] }
  /** Chưa có từ nào published (trong chủ đề/bài đã chọn). */
  | { status: "noWords" }
  /** Có từ nhưng không đủ để tạo phương án nhiễu cho trắc nghiệm. */
  | { status: "notEnoughWords" };

export async function getPracticeSession(
  actor: Actor | null,
  settings: PracticeSettings,
): Promise<PracticeSession> {
  assertUser(actor);
  const filter = await practiceFilter(settings);
  const [words, pool] = await Promise.all([
    pickWords(actor, settings.count, filter),
    modeNeedsPool(settings.mode) ? distractorPool(settings.topic) : Promise.resolve([]),
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
