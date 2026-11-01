import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { closeDb, describeDb, makeActor, resetDb, seedWords } from "../../../test/db";
import { collections } from "@/server/db/collections";
import { NotFoundError } from "@/server/dal/common";
import {
  createWord,
  getWord,
  listWords,
  setWordsStatus,
  updateWord,
  type WordInput,
} from "@/server/dal/words";

describeDb("DAL: quản lý từ vựng", () => {
  const editor = makeActor("editor");
  const input: WordInput = {
    word: "cat",
    meaningVi: "con mèo",
    ipa: "/kæt/",
    example: "",
    topic: "general",
    status: "published",
  };

  beforeAll(resetDb);
  afterAll(closeDb);
  beforeEach(resetDb);

  it("tạo từ: field trống không được lưu, có audit log", async () => {
    const { id } = await createWord(editor, input);
    const doc = await collections.words().findOne({});
    expect(doc).toMatchObject({ word: "cat", meaningVi: "con mèo", ipa: "/kæt/" });
    expect(doc).not.toHaveProperty("example");
    expect(await collections.auditLogs().findOne({})).toMatchObject({
      action: "word.create",
      target: { type: "word", id },
    });
  });

  it("sửa từ: ghi field đã đổi, xóa field bị để trống", async () => {
    const { id } = await createWord(editor, input);
    await updateWord(editor, id, { ...input, meaningVi: "mèo", ipa: "" });
    expect(await getWord(editor, id)).toMatchObject({ meaningVi: "mèo", ipa: "" });
    expect(await collections.words().findOne({})).not.toHaveProperty("ipa");
    const log = await collections.auditLogs().findOne({ action: "word.update" });
    expect(log?.meta).toEqual({ changed: ["meaningVi", "ipa"] });
  });

  it("sửa mà không đổi gì thì không ghi audit", async () => {
    const { id } = await createWord(editor, input);
    await updateWord(editor, id, input);
    expect(await collections.auditLogs().countDocuments({ action: "word.update" })).toBe(0);
  });

  it("sửa từ không tồn tại thì báo NotFound", async () => {
    await expect(updateWord(editor, "f".repeat(24), input)).rejects.toThrow(NotFoundError);
  });

  it("danh sách: tìm theo từ hoặc nghĩa, lọc trạng thái, phân trang", async () => {
    await seedWords(3, 2);
    expect((await listWords(editor, { query: "W1" })).items.map((w) => w.word)).toEqual(["w1"]);
    expect((await listWords(editor, { query: "nghĩa d" })).total).toBe(2);
    expect((await listWords(editor, { status: "draft" })).total).toBe(2);
    const page = await listWords(editor, { pageSize: 2, page: 2 });
    expect(page).toMatchObject({ total: 5, page: 2 });
    expect(page.items).toHaveLength(2);
  });

  it("lọc theo chủ đề", async () => {
    await seedWords(2, 1);
    await seedWords(1, 1, "medicine");
    expect((await listWords(editor, { topic: "medicine" })).total).toBe(2);
    expect((await listWords(editor, { topic: "medicine", status: "draft" })).total).toBe(1);
  });

  it("đổi trạng thái hàng loạt: chỉ đếm và audit từ thực sự đổi", async () => {
    const { publishedIds, draftIds } = await seedWords(1, 2);
    const res = await setWordsStatus(editor, [...draftIds, publishedIds[0]!], "published");
    expect(res).toEqual({ changed: 2 });
    expect(await collections.words().countDocuments({ status: "published" })).toBe(3);
    const log = await collections.auditLogs().findOne({ action: "word.bulkStatus" });
    expect(log?.meta).toEqual({ status: "published", ids: expect.arrayContaining(draftIds) });
    expect(log?.meta?.ids).toHaveLength(2);

    expect(await setWordsStatus(editor, draftIds, "published")).toEqual({ changed: 0 });
    expect(await collections.auditLogs().countDocuments({ action: "word.bulkStatus" })).toBe(1);
  });

  it("đổi trạng thái hàng loạt: id sai thì báo NotFound, quá giới hạn thì từ chối", async () => {
    await expect(setWordsStatus(editor, ["x"], "draft")).rejects.toThrow(NotFoundError);
    const tooMany = Array.from({ length: 101 }, () => "f".repeat(24));
    await expect(setWordsStatus(editor, tooMany, "draft")).rejects.toThrow(RangeError);
  });

  it("tìm kiếm với ký tự đặc biệt không bị hiểu là regex", async () => {
    await seedWords(2, 0);
    expect((await listWords(editor, { query: ".*" })).total).toBe(0);
  });
});
