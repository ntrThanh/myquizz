import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { closeDb, describeDb, makeActor, resetDb, seedWords } from "../../../test/db";
import type { PracticeSettings } from "@/lib/practice/config";
import { collections } from "@/server/db/collections";
import { NotFoundError } from "@/server/dal/common";
import { getPracticeSession, getStats, recordAnswer } from "@/server/dal/practice";

describeDb("DAL: luyện tập", () => {
  let ids: Awaited<ReturnType<typeof seedWords>>;
  const user = makeActor("user");
  const quiz: PracticeSettings = { mode: "quiz", direction: "en-vi", count: 10 };
  const typing: PracticeSettings = { mode: "typing", direction: "vi-en", count: 10 };

  const answer = (wordId: string, correct: boolean, actor = user) =>
    recordAnswer(actor, { wordId, mode: "quiz", direction: "en-vi", correct });

  beforeAll(resetDb);
  afterAll(closeDb);

  beforeEach(async () => {
    await resetDb();
    ids = await seedWords(5, 2);
  });

  it("chưa có từ nào thì báo noWords", async () => {
    await resetDb();
    expect(await getPracticeSession(user, quiz)).toEqual({ status: "noWords" });
  });

  it("lấy mọi từ published, không lấy draft, không cần thêm vào danh sách học trước", async () => {
    const s = await getPracticeSession(user, typing);
    if (s.status !== "ready") throw new Error(s.status);
    expect(s.questions.map((q) => q.wordId).sort()).toEqual([...ids.publishedIds].sort());
    expect(s.questions.every((q) => q.mode === "typing" && q.direction === "vi-en")).toBe(true);
  });

  it("giới hạn số câu theo cài đặt", async () => {
    await resetDb();
    await seedWords(15, 0);
    const s = await getPracticeSession(user, quiz);
    expect(s.status === "ready" && s.questions).toHaveLength(10);
  });

  it("trắc nghiệm báo thiếu từ khi chưa đủ phương án nhiễu", async () => {
    await resetDb();
    await seedWords(2, 5);
    expect(await getPracticeSession(user, quiz)).toEqual({ status: "notEnoughWords" });
    expect((await getPracticeSession(user, typing)).status).toBe("ready");
  });

  it("ưu tiên từ đến hạn và từ chưa học trước từ đã học", async () => {
    await resetDb();
    const many = await seedWords(12, 0);
    // 10 từ đã học, trả lời đúng nên chưa đến hạn hôm nay; còn 2 từ chưa học.
    for (const id of many.publishedIds.slice(0, 10)) await answer(id, true);
    const s = await getPracticeSession(user, { ...quiz, count: 10 });
    if (s.status !== "ready") throw new Error(s.status);
    const picked = s.questions.map((q) => q.wordId);
    expect(picked).toEqual(expect.arrayContaining(many.publishedIds.slice(10)));
  });

  it("lần trả lời đầu tạo tiến độ SM-2 và reviewLog", async () => {
    const res = await answer(ids.publishedIds[0]!, true);
    expect(res.interval).toBe(1);
    const progress = await collections.userWordProgress().findOne({});
    expect(progress).toMatchObject({ n: 1, ef: 2.5, interval: 1 });
    const log = await collections.reviewLogs().findOne({});
    expect(log).toMatchObject({
      q: 4,
      mode: "quiz",
      direction: "en-vi",
      before: { n: 0, ef: 2.5, interval: 0 },
    });
  });

  it("trả lời lại cập nhật đúng một bản ghi tiến độ", async () => {
    await answer(ids.publishedIds[0]!, true);
    await answer(ids.publishedIds[0]!, false);
    expect(await collections.userWordProgress().countDocuments()).toBe(1);
    expect(await collections.userWordProgress().findOne({})).toMatchObject({ n: 0, interval: 1 });
    expect(await collections.reviewLogs().countDocuments()).toBe(2);
  });

  it("từ không tồn tại hoặc id sai định dạng thì báo NotFound", async () => {
    await expect(answer("f".repeat(24), true)).rejects.toThrow(NotFoundError);
    await expect(answer("x", true)).rejects.toThrow(NotFoundError);
  });

  it("tiến độ tách riêng từng người", async () => {
    await answer(ids.publishedIds[0]!, true);
    const other = makeActor("user", "other");
    expect((await getStats(other)).learnedWords).toBe(0);
    expect((await getStats(user)).learnedWords).toBe(1);
  });

  it("thống kê: tổng từ, đã học, đến hạn, streak, tỉ lệ đúng 7 ngày", async () => {
    await answer(ids.publishedIds[0]!, true);
    await answer(ids.publishedIds[1]!, false);
    expect(await getStats(user)).toEqual({
      totalWords: 5,
      learnedWords: 2,
      dueToday: 0, // cả câu đúng lẫn sai (interval 1) đều dời sang ngày mai
      streak: 1,
      accuracy7d: 0.5,
      answers7d: 2,
    });
  });
});
