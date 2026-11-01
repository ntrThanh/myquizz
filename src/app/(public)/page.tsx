import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { getActor } from "@/server/auth/session";
import { ButtonLink, Card } from "@/components/ui";

export default async function Home() {
  const t = getMessages().home;
  const actor = await getActor();

  return (
    <div className="flex flex-col gap-12 py-8 sm:py-16">
      <section className="flex flex-col items-start gap-5">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={actor ? routes.learn : routes.register} className="px-5 py-3 text-base">
            {t.ctaStart}
          </ButtonLink>
          {!actor && (
            <ButtonLink href={routes.login} variant="secondary" className="px-5 py-3 text-base">
              {t.ctaLogin}
            </ButtonLink>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {t.features.map((f) => (
          <Card key={f.title}>
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
