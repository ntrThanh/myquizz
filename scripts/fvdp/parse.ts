import type { Topic } from "../../src/lib/topics";

// Đổi một mục từ điển FVDP Anh–Việt (nghĩa dạng HTML) sang field của `words`. Hàm thuần để test.
//
// Dạng HTML thường gặp:
//   <i>danh từ</i><br><ul><li>kẻ trộm</li><br><b>to cry thieves</b>: <i>hô hoán</i><li>(pháp lý) …</li></ul>
// Mục không có <i>từ loại</i> ở đầu phần lớn là thuật ngữ chuyên ngành.

/** Giới hạn khớp `WORD_LIMITS` của form từ vựng. */
export const LIMITS = { word: 100, meaningVi: 300, example: 500 } as const;

/** Số nghĩa tối đa giữ lại cho mỗi từ, để phương án trắc nghiệm không quá dài. */
const MAX_MEANINGS = 3;

export interface ParsedEntry {
  word: string;
  meaningVi: string;
  example?: string;
  topic: Topic;
}

/** Nhãn lĩnh vực ở đầu nghĩa, ví dụ `(y học)`, ứng với chủ đề nào. So khớp đầu nhãn. */
const LABEL_TOPICS: [Topic, string[]][] = [
  [
    "economics",
    [
      "econ",
      "kinh tế",
      "thương nghiệp",
      "thương mại",
      "bảo hiểm",
      "tài chính",
      "ngân hàng",
      "kế toán",
    ],
  ],
  ["computing", ["máy tính", "tin học", "tin"]],
  ["medicine", ["y học", "y", "giải phẫu", "dược"]],
  ["biology", ["sinh vật", "sinh học", "thực vật", "động vật", "côn trùng"]],
  ["chemistry", ["hoá học", "hóa học", "hoá", "hóa"]],
  ["physics", ["vật lý", "điện học", "thiên văn"]],
  ["math", ["toán", "đại số", "hình học", "thống kê"]],
  ["geography", ["địa lý", "địa chất", "ddịa chất", "khoáng"]],
  ["law", ["pháp lý", "luật", "chính trị"]],
  ["military", ["quân sự"]],
  ["transport", ["hàng hải", "hàng không", "ngành đường sắt", "đường sắt", "ô tô"]],
  [
    "arts",
    [
      "âm nhạc",
      "nhạc",
      "sân khấu",
      "thơ ca",
      "văn học",
      "kiến trúc",
      "hội hoạ",
      "hội họa",
      "điện ảnh",
      "mỹ thuật",
      "ngành in",
    ],
  ],
  ["sports", ["thể dục", "thể thao"]],
  [
    "humanities",
    ["sử học", "triết học", "ngôn ngữ học", "tôn giáo", "thần thoại", "thần học", "kinh thánh"],
  ],
  ["agriculture", ["nông nghiệp", "lâm nghiệp"]],
  ["technology", ["tech", "kỹ thuật", "điện tử", "cơ khí", "xây dựng", "luyện kim", "mỏ"]],
];

export function topicFromLabel(label: string): Topic | undefined {
  const l = label.normalize("NFC").trim().toLowerCase();
  for (const [topic, keys] of LABEL_TOPICS) {
    if (keys.some((k) => l === k || l.startsWith(`${k} `) || l.startsWith(`${k},`))) return topic;
  }
  return undefined;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

/** Bỏ thẻ HTML, giải mã ký tự, gộp khoảng trắng. */
export function toText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Cắt chuỗi ở ranh giới từ cho vừa `max` ký tự (kể cả dấu `…`). */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Nghĩa chỉ là tham chiếu sang từ khác ("xem cogent", "như colour") thì không dùng làm đáp án. */
function isReference(meaning: string): boolean {
  return /^(xem|như)\s+[\x20-\x7e]+$/i.test(meaning);
}

/** Nhãn "(xem)", "(như)" đánh dấu tham chiếu, không phải lĩnh vực. */
const REFERENCE_LABELS = new Set(["xem", "như"]);

/** Thành ngữ viết dạng `!to set a thief…<br><li>nghĩa của thành ngữ</li>`: bỏ cả cụm. */
function withoutIdioms(html: string): string {
  return html.replace(/![^<]*(?:<br>)?\s*<li>[\s\S]*?<\/li>/g, "");
}

/** Ghép các nghĩa bằng "; " (app chấp nhận gõ đúng một nghĩa bất kỳ), tối đa `MAX_MEANINGS`. */
function joinMeanings(meanings: string[]): string {
  let out = "";
  for (const m of meanings.slice(0, MAX_MEANINGS)) {
    const next = out ? `${out}; ${m}` : m;
    if (next.length > LIMITS.meaningVi) break;
    out = next;
  }
  return out || truncate(meanings[0] ?? "", LIMITS.meaningVi);
}

/**
 * Phân tích một mục. `htmls` là các khối nghĩa của cùng một từ (đôi khi có nhiều dòng).
 * Trả về `null` nếu từ quá dài hoặc không còn nghĩa dùng được.
 */
export function parseEntry(rawWord: string, htmls: string[]): ParsedEntry | null {
  const word = rawWord.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!word || word.length > LIMITS.word || word.startsWith("00-database")) return null;

  const meanings: string[] = [];
  const seen = new Set<string>();
  let firstLabel: string | undefined;
  let hasPartOfSpeech = false;
  let example: string | undefined;

  for (const html of htmls) {
    if (/^\s*<i>[^<]+<\/i>/.test(html)) hasPartOfSpeech = true;
    for (const [, li = ""] of withoutIdioms(html).matchAll(/<li>([\s\S]*?)<\/li>/g)) {
      let text = toText(li).normalize("NFC");
      const label = /^\(([^)]{2,40})\)\s*/.exec(text);
      if (label) {
        if (REFERENCE_LABELS.has(label[1]?.trim().toLowerCase() ?? "")) continue;
        firstLabel ??= meanings.length === 0 ? label[1] : undefined;
        text = text.slice(label[0].length).trim();
      }
      if (!text || isReference(text)) continue;
      // Bỏ nghĩa mà mọi nghĩa con (tách bằng , ;) đều đã xuất hiện ở nghĩa trước.
      const parts = text
        .toLowerCase()
        .split(/[,;]/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.every((p) => seen.has(p))) continue;
      for (const p of parts) seen.add(p);
      meanings.push(text);
    }
    if (example === undefined) {
      const b = /<b>([\s\S]*?)<\/b>/.exec(html);
      const text = b ? toText(b[1] ?? "") : "";
      if (text) example = truncate(text, LIMITS.example);
    }
  }
  if (meanings.length === 0) return null;

  const topic =
    (firstLabel && topicFromLabel(firstLabel)) || (hasPartOfSpeech ? "general" : "specialized");
  return { word, meaningVi: joinMeanings(meanings), ...(example ? { example } : {}), topic };
}
