"use client";

import { useEffect, useRef } from "react";

/** Phím tắt toàn trang; bỏ qua khi đang gõ trong ô nhập liệu hoặc giữ phím bổ trợ. */
export function useHotkeys(handler: (key: string, e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      ref.current(e.key, e);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
