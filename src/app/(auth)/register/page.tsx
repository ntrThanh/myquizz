import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { getActor } from "@/server/auth/session";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: getMessages().auth.registerTitle };

export default async function Page() {
  if (await getActor()) redirect(routes.learn);
  return (
    <div className="py-8">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
