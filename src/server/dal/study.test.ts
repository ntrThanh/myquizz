import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { closeDb, describeDb, makeActor, resetDb, seedContent } from "../../../test/db";
import { collections } from "@/server/db/collections";
import {
  getDueCards,
  getQuizQuestions,
  getStats,
  getTypingCards,
  recordReview,
  startLesson,
} from "@/server/dal/study";

describeDb("DAL: học và ôn tập", () => {
  let ids: Awaited<ReturnType<typeof seedContent>>;
  const user = makeActor("user");

  beforeAll(resetDb);
  afterAll(closeDb);

  beforeEach(async () => {
    await resetDb();
    ids = await seedContent(5);
  });

  it("startLesson thêm từ một lần, chạy lại không trùng", async () => {
    expect(await startLesson(user, ids.pubLessonId)).toEqual({ added: 5 });
    expect(await startLesson(user, ids.pubLessonId)).toEqual({ added: 0 });
    expect((await getDueCards(user)).totalDue).toBe(5);
  });

  it("recordReview cập nhật SM-2, ghi log và đẩy thẻ khỏi danh sách hôm nay", async () => {
    await startLesson(user, ids.pubLessonId);
    const { cards } = await getDueCards(user);
    const res = await recordReview(user, { wordId: cards[0]!.wordId, q: 4, mode: "flashcard" });
    expect(res.interval).toBe(1);
    expect((await getDueCards(user)).totalDue).toBe(4);
    const log = await collections.reviewLogs().findOne({});
    expect(log).toMatchObject({ q: 4, mode: "flashcard", before: { n: 0, ef: 2.5, interval: 0 } });
    expect(log!.after).toMatchObject({ n: 1, ef: 2.5, interval: 1 });
  });

  it("quiz có 4 đáp án khác nhau, đúng một đáp án đúng", async () => {
    await startLesson(user, ids.pubLessonId);
    const { questions, notEnoughWords } = await getQuizQuestions(user, 5);
    expect(notEnoughWords).toBe(false);
    expect(questions).toHaveLength(5);
    for (const q of questions) {
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.filter((o) => o === q.meaningVi)).toHaveLength(1);
    }
  });

  it("quiz báo thiếu từ khi toàn hệ thống chưa đủ 4 nghĩa", async () => {
    await resetDb();
    const few = await seedContent(1);
    await collections.words().deleteMany({ word: /^d/ }); // bỏ từ của khóa draft
    await startLesson(user, few.pubLessonId);
    expect(await getQuizQuestions(user)).toEqual({ questions: [], notEnoughWords: true });
  });

  it("gõ đáp án lấy từ trong danh sách học", async () => {
    await startLesson(user, ids.pubLessonId);
    expect(await getTypingCards(user, 3)).toHaveLength(3);
  });

  it("thống kê: đến hạn, tổng, streak, tỉ lệ nhớ 7 ngày", async () => {
    await startLesson(user, ids.pubLessonId);
    const { cards } = await getDueCards(user);
    await recordReview(user, { wordId: cards[0]!.wordId, q: 5, mode: "flashcard" });
    await recordReview(user, { wordId: cards[1]!.wordId, q: 0, mode: "quiz" });
    expect(await getStats(user)).toEqual({
      dueToday: 3, // cả thẻ đúng lẫn thẻ sai (interval 1) đều dời sang ngày mai
      totalLearning: 5,
      streak: 1,
      retention7d: 0.5,
      reviews7d: 2,
    });
  });
});
