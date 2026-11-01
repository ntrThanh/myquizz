import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { getActor } from "@/server/auth/session";
import { ButtonLink, Card } from "@/components/ui";

export default async function Home() {
  const t = getMessages().home;
  const actor = await getActor();

  return (
    <div className="flex flex-col gap-14 py-8 sm:py-20">
      <section className="stagger flex flex-col items-start gap-6">
        <h1 className="max-w-3xl pb-1 text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-7xl">
          {t.title}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-label-secondary sm:text-xl">
          {t.subtitle}
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={actor ? routes.learn : routes.register} className="px-6 py-3 text-base">
            {t.ctaStart}
          </ButtonLink>
          {!actor && (
            <ButtonLink href={routes.login} variant="secondary" className="px-6 py-3 text-base">
              {t.ctaLogin}
            </ButtonLink>
          )}
        </div>
      </section>
      <section className="stagger grid gap-4 sm:grid-cols-3">
        {t.features.map((f, i) => (
          <Card
            key={f.title}
            className="transition-transform duration-500 ease-apple-out hover:-translate-y-1"
          >
            <span className="text-sm font-bold text-accent tabular-nums">0{i + 1}</span>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">{f.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-label-secondary">{f.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
