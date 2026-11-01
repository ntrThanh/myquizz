"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui";

export function SignOutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      className="px-2 whitespace-nowrap sm:px-4"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await authClient.signOut();
          router.push(routes.home);
          router.refresh();
        })
      }
    >
      {getMessages().nav.logout}
    </Button>
  );
}
