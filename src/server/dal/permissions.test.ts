import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, describeDb, insertUser, makeActor, resetDb, seedContent } from "../../../test/db";
import { ForbiddenError, UnauthorizedError, type Actor } from "@/server/auth/roles";
import { listAuditLogs } from "@/server/dal/audit";
import { NotFoundError } from "@/server/dal/common";
import { getCourseBySlug, listCourses } from "@/server/dal/courses";
import {
  getDueCards,
  getQuizQuestions,
  getStats,
  getTypingCards,
  recordReview,
  startLesson,
} from "@/server/dal/study";
import { countUsers, listUsers, setUserRole } from "@/server/dal/users";

// Ma trận quyền cho mọi hàm DAL (CLAUDE.md §5.1): khách, user, editor, admin.

type Who = "guest" | "user" | "editor" | "admin";
type Expect = "ok" | "unauthorized" | "forbidden";

const actors: Record<Who, Actor | null> = {
  guest: null,
  user: makeActor("user"),
  editor: makeActor("editor"),
  admin: makeActor("admin"),
};

async function outcome(fn: () => Promise<unknown>): Promise<Expect | string> {
  try {
    await fn();
    return "ok";
  } catch (e) {
    if (e instanceof UnauthorizedError) return "unauthorized";
    if (e instanceof ForbiddenError) return "forbidden";
    throw e;
  }
}

describeDb("DAL: ma trận quyền", () => {
  let ids: Awaited<ReturnType<typeof seedContent>>;
  let target: Actor;

  beforeAll(async () => {
    await resetDb();
    ids = await seedContent();
    target = makeActor("user", "target");
    for (const a of [actors.user, actors.editor, actors.admin, target]) await insertUser(a!);
    await startLesson(actors.user, ids.pubLessonId);
  });

  afterAll(closeDb);

  const userOnly: Record<Who, Expect> = {
    guest: "unauthorized",
    user: "ok",
    editor: "ok",
    admin: "ok",
  };
  const adminOnly: Record<Who, Expect> = {
    guest: "unauthorized",
    user: "forbidden",
    editor: "forbidden",
    admin: "ok",
  };
  const everyone: Record<Who, Expect> = { guest: "ok", user: "ok", editor: "ok", admin: "ok" };

  const table: [string, Record<Who, Expect>, (a: Actor | null) => Promise<unknown>][] = [
    ["listCourses", everyone, (a) => listCourses(a)],
    ["getCourseBySlug", everyone, (a) => getCourseBySlug(a, "co-ban")],
    ["startLesson", userOnly, (a) => startLesson(a, ids.pubLessonId)],
    ["getDueCards", userOnly, (a) => getDueCards(a)],
    ["getTypingCards", userOnly, (a) => getTypingCards(a)],
    ["getQuizQuestions", userOnly, (a) => getQuizQuestions(a)],
    ["getStats", userOnly, (a) => getStats(a)],
    ["listUsers", adminOnly, (a) => listUsers(a)],
    ["countUsers", adminOnly, (a) => countUsers(a)],
    ["listAuditLogs", adminOnly, (a) => listAuditLogs(a)],
    ["setUserRole", adminOnly, (a) => setUserRole(a, target.id, "user")],
  ];

  for (const [name, expected, fn] of table) {
    describe(name, () => {
      for (const who of Object.keys(expected) as Who[]) {
        it(`${who} → ${expected[who]}`, async () => {
          expect(await outcome(() => fn(actors[who]))).toBe(expected[who]);
        });
      }
    });
  }

  it("recordReview: khách bị chặn", async () => {
    const { cards } = await getDueCards(actors.user);
    expect(
      await outcome(() =>
        recordReview(null, { wordId: cards[0]!.wordId, q: 4, mode: "flashcard" }),
      ),
    ).toBe("unauthorized");
  });

  describe("nội dung draft", () => {
    it("khách và user không thấy khóa draft", async () => {
      for (const a of [null, actors.user]) {
        expect((await listCourses(a)).items.map((c) => c.slug)).toEqual(["co-ban"]);
        expect(await getCourseBySlug(a, "nhap")).toBeNull();
      }
    });

    it("editor và admin thấy khóa draft", async () => {
      for (const a of [actors.editor, actors.admin]) {
        expect((await listCourses(a)).items).toHaveLength(2);
        expect(await getCourseBySlug(a, "nhap")).not.toBeNull();
      }
    });

    it("user không bắt đầu được bài draft", async () => {
      await expect(startLesson(actors.user, ids.draftLessonId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("cách ly dữ liệu cá nhân", () => {
    it("user khác không thấy và không ôn được thẻ của user này", async () => {
      const other = makeActor("user", "other");
      const { cards } = await getDueCards(actors.user);
      expect(cards.length).toBeGreaterThan(0);
      expect((await getDueCards(other)).cards).toEqual([]);
      await expect(
        recordReview(other, { wordId: cards[0]!.wordId, q: 4, mode: "flashcard" }),
      ).rejects.toThrow(NotFoundError);
    });

    it("tiến độ trên trang khóa học chỉ tính của người xem", async () => {
      const mine = await getCourseBySlug(actors.user, "co-ban");
      const theirs = await getCourseBySlug(makeActor("user"), "co-ban");
      expect(mine!.lessons[0]!.learningCount).toBe(5);
      expect(theirs!.lessons[0]!.learningCount).toBe(0);
    });
  });

  describe("đổi role", () => {
    it("admin không tự đổi role của mình", async () => {
      await expect(setUserRole(actors.admin, actors.admin!.id, "user")).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("đổi role được ghi audit log", async () => {
      await setUserRole(actors.admin, target.id, "editor");
      const { items } = await listAuditLogs(actors.admin);
      expect(items[0]).toMatchObject({
        action: "user.setRole",
        actorEmail: actors.admin!.email,
        target: { type: "user", id: target.id },
        meta: { from: "user", to: "editor" },
      });
    });

    it("id sai định dạng coi như không tồn tại", async () => {
      await expect(setUserRole(actors.admin, "not-an-id", "user")).rejects.toThrow(NotFoundError);
    });
  });
});
