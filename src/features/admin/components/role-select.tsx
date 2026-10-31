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
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
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
          className={`text-xs ${message.error ? "text-rose-600" : "text-emerald-600"}`}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
