import vi from "@/messages/vi.json";

export type Messages = typeof vi;

// Hiện chỉ có tiếng Việt; khi thêm en.json thì chọn theo locale ở đây.
export function getMessages(): Messages {
  return vi;
}

/** Thay `{name}` trong chuỗi: fmt("Còn {count} thẻ", { count: 3 }). */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function formatDateTime(d: Date, timeZone?: string): string {
  return timeZone
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone }).format(
        d,
      )
    : dateFormat.format(d);
}
