import { describe, expect, it } from "vitest";
import { LIMITS, parseEntry, toText, topicFromLabel } from "./parse";

describe("parseEntry", () => {
  it("từ thông dụng: lấy tối đa 3 nghĩa, bỏ nhãn, lấy cụm ví dụ tiếng Anh", () => {
    const html =
      "<i>danh từ</i><br><ul><li>phong tục, tục lệ</li><br><b>to be a slave to custom</b>: <i>quá nệ theo phong tục</i>" +
      "<li>(pháp lý) luật pháp theo tục lệ</li><li>khách hàng</li><li>thuế quan</li></ul>";
    expect(parseEntry("custom", [html])).toEqual({
      word: "custom",
      meaningVi: "phong tục, tục lệ; luật pháp theo tục lệ; khách hàng",
      example: "to be a slave to custom",
      topic: "general",
    });
  });

  it("nhãn lĩnh vực ở nghĩa đầu quyết định chủ đề", () => {
    expect(
      parseEntry("aorta", ["<i>danh từ</i><br><ul><li>(giải phẫu) động mạch chủ</li></ul>"]),
    ).toMatchObject({ meaningVi: "động mạch chủ", topic: "medicine" });
  });

  it("thuật ngữ không có từ loại và không có nhãn thì là chuyên ngành khác", () => {
    expect(parseEntry("coarse file", ["<ul><li>giũa thô</li><li>giũa thô</li></ul>"])).toEqual({
      word: "coarse file",
      meaningVi: "giũa thô",
      topic: "specialized",
    });
  });

  it("bỏ nghĩa chỉ là tham chiếu; không còn nghĩa nào thì bỏ cả mục", () => {
    expect(parseEntry("cogently", ["<ul><li>xem cogent</li></ul>"])).toBeNull();
    expect(parseEntry("colour", ["<ul><li>như color</li><li>màu sắc</li></ul>"])?.meaningVi).toBe(
      "màu sắc",
    );
  });

  it("bỏ mục thông tin của từ điển và từ quá dài", () => {
    expect(parseEntry("00-database-info", ["<ul><li>info</li></ul>"])).toBeNull();
    expect(parseEntry("x".repeat(LIMITS.word + 1), ["<ul><li>a</li></ul>"])).toBeNull();
  });

  it("nghĩa quá dài thì cắt ở ranh giới từ cho vừa giới hạn", () => {
    const long = "rất dài ".repeat(60);
    const m = parseEntry("long", [`<ul><li>${long}</li></ul>`])!.meaningVi;
    expect(m.length).toBeLessThanOrEqual(LIMITS.meaningVi);
    expect(m.endsWith("…")).toBe(true);
  });

  it("bỏ thành ngữ (đánh dấu bằng !) và tham chiếu (xem)", () => {
    const html =
      "<i>danh từ</i><br><ul><li>kẻ trộm, kẻ cắp</li><br><b>to cry out thieves</b>: <i>kêu trộm</i>" +
      "!to set a thief to catch thief<br><li>lấy giặc bắt giặc</li>!thieves' Latin<br><li>(xem) Latin</li>" +
      "<li>bơm hút</li><li>kẻ cắp</li></ul>";
    expect(parseEntry("thief", [html])?.meaningVi).toBe("kẻ trộm, kẻ cắp; bơm hút");
  });

  it("gộp nhiều khối nghĩa của cùng một từ", () => {
    expect(
      parseEntry("bank", ["<ul><li>ngân hàng</li></ul>", "<ul><li>bờ sông</li></ul>"])?.meaningVi,
    ).toBe("ngân hàng; bờ sông");
  });
});

describe("topicFromLabel", () => {
  it("khớp đầu nhãn, không khớp nhầm giữa chừng", () => {
    expect(topicFromLabel("Y học")).toBe("medicine");
    expect(topicFromLabel("thực vật học")).toBe("biology");
    expect(topicFromLabel("địa lý,địa chất")).toBe("geography");
    expect(topicFromLabel("tech")).toBe("technology");
    expect(topicFromLabel("từ mỹ,nghĩa mỹ")).toBeUndefined();
    expect(topicFromLabel("thông tục")).toBeUndefined();
  });
});

describe("toText", () => {
  it("bỏ thẻ và giải mã ký tự", () => {
    expect(toText("<b>A&amp;B</b>&nbsp; &#273;i")).toBe("A&B đi");
  });
});
