import "server-only";
import { ObjectId, type AnyBulkWriteOperation } from "mongodb";
import { startOfDayPlus } from "@/lib/day";
import { INITIAL_SM2, review, type Quality } from "@/lib/sm2";
import { computeStreak, retentionRate } from "@/lib/stats";
import { assertUser, hasRole, type Actor } from "@/server/auth/roles";
import { getMongoClient } from "@/server/db/client";
import {
  collections,
  type StudyMode,
  type UserWordProgressDoc,
  type WordDoc,
} from "@/server/db/collections";
import { NotFoundError, toObjectId } from "@/server/dal/common";

// Mọi truy vấn tiến độ đều lọc theo actor.id lấy từ session.

export interface StudyCard {
  wordId: string;
  word: string;
  meaningVi: string;
  ipa: string | null;
  example: string | null;
}

export interface QuizQuestion extends StudyCard {
  /** 4 nghĩa đã xáo trộn, có đúng một nghĩa bằng `meaningVi`. */
  options: string[];
}

function toCard(w: WordDoc): StudyCard {
  return {
    wordId: w._id.toHexString(),
    word: w.word,
    meaningVi: w.meaningVi,
    ipa: w.ipa ?? null,
    example: w.example ?? null,
  };
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function endOfToday(actor: Actor, now = new Date()) {
  return startOfDayPlus(now, 1, actor.timeZone);
}

/** Thêm các từ (published) của một bài vào danh sách học. Chạy lại không tạo trùng. */
export async function startLesson(
  actor: Actor | null,
  lessonId: string,
): Promise<{ added: number }> {
  assertUser(actor);
  const _id = toObjectId(lessonId, "Bài học");
  const published = hasRole(actor, "editor") ? {} : { status: "published" as const };
  const lesson = await collections.lessons().findOne({ _id, ...published });
  if (!lesson) throw new NotFoundError("Bài học");
  const course = await collections.courses().findOne({ _id: lesson.courseId, ...published });
  if (!course) throw new NotFoundError("Bài học");

  const words = await collections
    .words()
    .find({ lessonId: _id, status: "published" }, { projection: { _id: 1 } })
    .limit(1000)
    .toArray();
  if (words.length === 0) return { added: 0 };

  const now = new Date();
  const userId = new ObjectId(actor.id);
  const ops: AnyBulkWriteOperation<UserWordProgressDoc>[] = words.map((w) => ({
    updateOne: {
      filter: { userId, wordId: w._id },
      update: {
        $setOnInsert: {
          _id: new ObjectId(),
          userId,
          wordId: w._id,
          courseId: lesson.courseId,
          lessonId: _id,
          ...INITIAL_SM2,
          dueDate: startOfDayPlus(now, 0, actor.timeZone),
          lastReviewedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      },
      upsert: true,
    },
  }));
  const res = await collections.userWordProgress().bulkWrite(ops, { ordered: false });
  return { added: res.upsertedCount };
}

async function wordsFor(progress: Pick<UserWordProgressDoc, "wordId">[]) {
  const words = await collections
    .words()
    .find({ _id: { $in: progress.map((p) => p.wordId) }, status: "published" })
    .toArray();
  const byId = new Map(words.map((w) => [w._id.toHexString(), w]));
  return progress.flatMap((p) => byId.get(p.wordId.toHexString()) ?? []);
}

/** Thẻ đến hạn hôm nay (dueDate trước 00:00 ngày mai theo múi giờ người dùng). */
export async function getDueCards(
  actor: Actor | null,
  limit = 50,
): Promise<{ cards: StudyCard[]; totalDue: number }> {
  assertUser(actor);
  const filter = { userId: new ObjectId(actor.id), dueDate: { $lt: endOfToday(actor) } };
  const [progress, totalDue] = await Promise.all([
    collections
      .userWordProgress()
      .find(filter, { projection: { wordId: 1 } })
      .sort({ dueDate: 1, _id: 1 })
      .limit(Math.min(limit, 200))
      .toArray(),
    collections.userWordProgress().countDocuments(filter),
  ]);
  return { cards: (await wordsFor(progress)).map(toCard), totalDue };
}

/** Chọn từ để luyện: ưu tiên từ đến hạn, thiếu thì lấy ngẫu nhiên trong danh sách học. */
async function pickPracticeWords(actor: Actor, count: number): Promise<WordDoc[]> {
  const userId = new ObjectId(actor.id);
  const due = await collections
    .userWordProgress()
    .find({ userId, dueDate: { $lt: endOfToday(actor) } }, { projection: { wordId: 1 } })
    .sort({ dueDate: 1 })
    .limit(count)
    .toArray();
  const rest =
    due.length < count
      ? await collections
          .userWordProgress()
          .aggregate<Pick<UserWordProgressDoc, "wordId">>([
            { $match: { userId, wordId: { $nin: due.map((d) => d.wordId) } } },
            { $sample: { size: count - due.length } },
            { $project: { wordId: 1 } },
          ])
          .toArray()
      : [];
  return shuffle(await wordsFor([...due, ...rest]));
}

export async function getTypingCards(actor: Actor | null, count = 10): Promise<StudyCard[]> {
  assertUser(actor);
  return (await pickPracticeWords(actor, Math.min(count, 50))).map(toCard);
}

/**
 * Câu hỏi trắc nghiệm: 1 nghĩa đúng + 3 nghĩa nhiễu, ưu tiên lấy từ cùng bài, rồi cùng khóa,
 * rồi bất kỳ từ nào. Trả về `notEnoughWords` nếu toàn hệ thống chưa đủ 4 nghĩa khác nhau.
 */
export async function getQuizQuestions(
  actor: Actor | null,
  count = 10,
): Promise<{ questions: QuizQuestion[]; notEnoughWords: boolean }> {
  assertUser(actor);
  const targets = await pickPracticeWords(actor, Math.min(count, 50));
  if (targets.length === 0) return { questions: [], notEnoughWords: false };

  const courseIds = [...new Set(targets.map((t) => t.courseId.toHexString()))].map(
    (id) => new ObjectId(id),
  );
  const [sameCourse, anyWords] = await Promise.all([
    collections
      .words()
      .find({ courseId: { $in: courseIds }, status: "published" })
      .limit(500)
      .toArray(),
    collections
      .words()
      .aggregate<WordDoc>([{ $match: { status: "published" } }, { $sample: { size: 50 } }])
      .toArray(),
  ]);

  const questions: QuizQuestion[] = [];
  for (const t of targets) {
    const pools = [
      sameCourse.filter((w) => w.lessonId.equals(t.lessonId)),
      sameCourse.filter((w) => !w.lessonId.equals(t.lessonId)),
      anyWords,
    ];
    const distractors = new Set<string>();
    for (const pool of pools) {
      for (const w of shuffle(pool)) {
        if (distractors.size === 3) break;
        if (w.meaningVi !== t.meaningVi) distractors.add(w.meaningVi);
      }
    }
    if (distractors.size < 3) return { questions: [], notEnoughWords: true };
    questions.push({ ...toCard(t), options: shuffle([t.meaningVi, ...distractors]) });
  }
  return { questions, notEnoughWords: false };
}

/** Ghi một lượt ôn: cập nhật SM-2 và thêm reviewLog trong cùng một transaction. */
export async function recordReview(
  actor: Actor | null,
  input: { wordId: string; q: Quality; mode: StudyMode },
): Promise<{ interval: number; dueDate: Date }> {
  assertUser(actor);
  const wordId = toObjectId(input.wordId, "Từ");
  const userId = new ObjectId(actor.id);
  const now = new Date();

  const session = getMongoClient().startSession();
  try {
    return await session.withTransaction(async () => {
      const progress = await collections
        .userWordProgress()
        .findOne({ userId, wordId }, { session });
      if (!progress) throw new NotFoundError("Từ trong danh sách học");

      const before = { n: progress.n, ef: progress.ef, interval: progress.interval };
      const next = review(before, input.q, { now, timeZone: actor.timeZone });
      await collections
        .userWordProgress()
        .updateOne(
          { _id: progress._id },
          { $set: { ...next, lastReviewedAt: now, updatedAt: now } },
          { session },
        );
      await collections.reviewLogs().insertOne(
        {
          _id: new ObjectId(),
          userId,
          wordId,
          q: input.q,
          mode: input.mode,
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

export interface StudyStats {
  dueToday: number;
  totalLearning: number;
  streak: number;
  /** Tỉ lệ q >= 3 trong 7 ngày gần nhất (tính cả hôm nay); null nếu chưa có lượt ôn. */
  retention7d: number | null;
  reviews7d: number;
}

export async function getStats(actor: Actor | null): Promise<StudyStats> {
  assertUser(actor);
  const userId = new ObjectId(actor.id);
  const now = new Date();
  const since7d = startOfDayPlus(now, -6, actor.timeZone);
  const since1y = startOfDayPlus(now, -366, actor.timeZone);

  const [dueToday, totalLearning, days, week] = await Promise.all([
    collections
      .userWordProgress()
      .countDocuments({ userId, dueDate: { $lt: endOfToday(actor, now) } }),
    collections.userWordProgress().countDocuments({ userId }),
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
    dueToday,
    totalLearning,
    streak: computeStreak(
      days.map((d) => d._id),
      now,
      actor.timeZone,
    ),
    retention7d: retentionRate(w.correct, w.total),
    reviews7d: w.total,
  };
}
