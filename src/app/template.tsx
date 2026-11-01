import type { ReactNode } from "react";

// template (khác layout) được dựng lại mỗi lần đổi trang, nên trang mới nào cũng hiện lên nhẹ nhàng.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
