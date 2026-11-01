"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { safeNext } from "@/lib/safe-redirect";
import { Alert, Button, Card, inputClass } from "@/components/ui";

const t = getMessages().auth;

function errorMessage(code: string | undefined, status: number | undefined): string {
  if (status === 429) return t.tooMany;
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return t.invalidCredentials;
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return t.userExists;
    case "PASSWORD_TOO_SHORT":
      return t.weakPassword;
    default:
      return t.failed;
  }
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isRegister = mode === "register";

  function onSubmit(form: FormData) {
    setError(null);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    start(async () => {
      const res = isRegister
        ? await authClient.signUp.email({
            email,
            password,
            name: String(form.get("name") ?? "").trim(),
          })
        : await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(errorMessage(res.error.code, res.error.status));
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  const other = isRegister
    ? { text: t.hasAccount, label: t.submitLogin, href: routes.login }
    : { text: t.noAccount, label: t.submitRegister, href: routes.register };

  return (
    <Card className="mx-auto w-full max-w-sm p-6 sm:p-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {isRegister ? t.registerTitle : t.loginTitle}
      </h1>
      <form action={onSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.name}
            <input name="name" required maxLength={80} autoComplete="name" className={inputClass} />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.email}
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.password}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className={inputClass}
          />
          {isRegister && <span className="font-normal text-label-secondary">{t.passwordHint}</span>}
        </label>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={pending} className="mt-1 py-3 text-base">
          {isRegister ? t.submitRegister : t.submitLogin}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-label-secondary">
        {other.text}{" "}
        <Link
          href={
            next === routes.learn ? other.href : `${other.href}?next=${encodeURIComponent(next)}`
          }
          className="font-semibold text-accent hover:underline"
        >
          {other.label}
        </Link>
      </p>
    </Card>
  );
}
