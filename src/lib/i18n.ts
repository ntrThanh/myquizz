import vi from "@/messages/vi.json";

export type Messages = typeof vi;

// Hiện chỉ có tiếng Việt; khi thêm en.json thì chọn theo locale ở đây.
export function getMessages(): Messages {
  return vi;
}
