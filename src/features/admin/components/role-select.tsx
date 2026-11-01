"use client";

import { useState, useTransition } from "react";
import { getMessages } from "@/lib/i18n";
import { ROLES, type Role } from "@/lib/types";
import { setRoleAction } from "@/features/admin/actions";

const t = getMessages().admin;

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(role);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={t.colRole}
        value={value}
        disabled={disabled || pending}
        onChange={(e) => {
          const next = e.target.value as Role;
          const prev = value;
          setValue(next);
          setMessage(null);
          start(async () => {
            const res = await setRoleAction({ userId, role: next });
            if (res.ok) setMessage({ text: t.saved });
            else {
              setValue(prev);
              setMessage({ text: res.error, error: true });
            }
          });
        }}
        className="rounded-lg bg-field px-2 py-1 text-sm shadow-[inset_0_0_0_1px_var(--separator)] disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t.roles[r]}
          </option>
        ))}
      </select>
      {message && (
        <span
          role="status"
          className={`text-xs ${message.error ? "text-danger-ink" : "text-success-ink"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
