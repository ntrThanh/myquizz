import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, describeDb, insertUser, makeActor, resetDb, seedWords } from "../../../test/db";
import { DEFAULT_PRACTICE_SETTINGS } from "@/lib/practice/config";
import { ForbiddenError, UnauthorizedError, type Actor } from "@/server/auth/roles";
import { listAuditLogs } from "@/server/dal/audit";
import { NotFoundError } from "@/server/dal/common";
import {
  getPracticeSession,
  getStats,
  listPracticeTopics,
  recordAnswer,
} from "@/server/dal/practice";
import { countUsers, listUsers, setUserRole } from "@/server/dal/users";
import {
  countWords,
  createWord,
  getWord,
  listWords,
  setWordsStatus,
  updateWord,
  type WordInput,
} from "@/server/dal/words";

// Ma trận quyền cho mọi hàm DAL (CLAUDE.md §5.1): khách, user, editor, admin.

type Who = "guest" | "user" | "editor" | "admin";
type Expect = "ok" | "unauthorized" | "forbidden";

const actors: Record<Who, Actor | null> = {
  guest: null,
  user: makeActor("user"),
  editor: makeActor("editor"),
  admin: makeActor("admin"),
};

const newWord: WordInput = {
  word: "cat",
  meaningVi: "con mèo",
  ipa: "",
  example: "",
  topic: "general",
  status: "draft",
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
  let ids: Awaited<ReturnType<typeof seedWords>>;
  let target: Actor;

  beforeAll(async () => {
    await resetDb();
    ids = await seedWords(5, 3); // d2 dành cho updateWord trong bảng bên dưới
    target = makeActor("user", "target");
    for (const a of [actors.user, actors.editor, actors.admin, target]) await insertUser(a!);
  });

  afterAll(closeDb);

  const userOnly: Record<Who, Expect> = {
    guest: "unauthorized",
    user: "ok",
    editor: "ok",
    admin: "ok",
  };
  const editorOnly: Record<Who, Expect> = {
    guest: "unauthorized",
    user: "forbidden",
    editor: "ok",
    admin: "ok",
  };
  const adminOnly: Record<Who, Expect> = {
    guest: "unauthorized",
    user: "forbidden",
    editor: "forbidden",
    admin: "ok",
  };

  const table: [string, Record<Who, Expect>, (a: Actor | null) => Promise<unknown>][] = [
    ["getPracticeSession", userOnly, (a) => getPracticeSession(a, DEFAULT_PRACTICE_SETTINGS)],
    [
      "recordAnswer",
      userOnly,
      (a) =>
        recordAnswer(a, {
          wordId: ids.publishedIds[0]!,
          mode: "quiz",
          direction: "en-vi",
          correct: true,
        }),
    ],
    ["getStats", userOnly, (a) => getStats(a)],
    ["listPracticeTopics", userOnly, (a) => listPracticeTopics(a)],
    ["listWords", editorOnly, (a) => listWords(a)],
    ["getWord", editorOnly, (a) => getWord(a, ids.publishedIds[0]!)],
    ["countWords", editorOnly, (a) => countWords(a)],
    ["createWord", editorOnly, (a) => createWord(a, newWord)],
    ["updateWord", editorOnly, (a) => updateWord(a, ids.draftIds[2]!, newWord)],
    // Từ đã published, đặt lại published: không đổi dữ liệu của các test khác.
    ["setWordsStatus", editorOnly, (a) => setWordsStatus(a, [ids.publishedIds[4]!], "published")],
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

  describe("nội dung draft", () => {
    it("user không trả lời được từ draft", async () => {
      await expect(
        recordAnswer(actors.user, {
          wordId: ids.draftIds[0]!,
          mode: "typing",
          direction: "vi-en",
          correct: true,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("editor thấy cả từ draft trong trang quản trị", async () => {
      const { items } = await listWords(actors.editor, { status: "draft" });
      expect(items.map((w) => w.word)).toEqual(expect.arrayContaining(["d0", "d1"]));
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
