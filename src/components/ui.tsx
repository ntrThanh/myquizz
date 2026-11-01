import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_16px_-6px_var(--accent)] hover:brightness-110 active:brightness-95",
  // Nút phụ là một viên kính mỏng.
  secondary: "glass-thin text-label hover:brightness-[0.98]",
  ghost: "text-label-secondary hover:bg-fill-4 hover:text-label",
  danger: "bg-danger text-white hover:brightness-110 active:brightness-95",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `press inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`glass rounded-3xl p-5 ${className}`} {...props} />;
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance">{title}</h1>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass-thin animate-rise rounded-3xl px-6 py-14 text-center">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-label-secondary">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: "zinc" | "amber" | "indigo";
}) {
  const tones = {
    zinc: "bg-fill-3 text-label-secondary",
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    indigo: "bg-accent/15 text-accent dark:text-indigo-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success";
}) {
  const tones = {
    error: "bg-danger/12 text-danger-ink",
    success: "bg-success/15 text-success-ink",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`animate-rise rounded-2xl px-4 py-2.5 text-sm font-medium ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

export const inputClass =
  "w-full rounded-xl border-0 bg-field px-4 py-2.5 text-base text-label shadow-[inset_0_0_0_1px_var(--separator)] outline-none transition-shadow duration-200 placeholder:text-label-tertiary focus:shadow-[inset_0_0_0_2px_var(--accent),0_0_0_4px_color-mix(in_srgb,var(--accent)_18%,transparent)]";
