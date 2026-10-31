import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n";
import { getActor } from "@/server/auth/session";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: getMessages().auth.loginTitle };

export default async function Page() {
  if (await getActor()) redirect("/learn");
  return (
    <div className="py-8">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
