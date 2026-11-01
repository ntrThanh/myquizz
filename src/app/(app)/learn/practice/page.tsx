import type { Metadata } from "next";
import { fmt, getMessages } from "@/lib/i18n";
import { QUIZ_OPTION_COUNT } from "@/lib/practice/config";
import { routes, withQuery } from "@/lib/routes";
import { requireActor } from "@/server/auth/session";
import { getPracticeSession } from "@/server/dal/practice";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { PracticeSession } from "@/features/practice/components/practice-session";
import { lessonName } from "@/features/practice/lesson-name";
import { parsePracticeSettings, practiceSettingsQuery } from "@/features/practice/schemas";

export const metadata: Metadata = { title: getMessages().practice.title };

export default async function PracticePage({ searchParams }: PageProps<"/learn/practice">) {
  const t = getMessages().practice;
  const settings = parsePracticeSettings(await searchParams);
  const query = practiceSettingsQuery(settings);
  const actor = await requireActor(withQuery(routes.practice, query));
  const session = await getPracticeSession(actor, settings);
  // Nút "Đổi cài đặt" quay về trang bài (giữ cài đặt vừa dùng), hoặc trang chủ đề/tổng quan.
  const { topic, lesson } = settings;
  const settingsHref =
    topic === "all"
      ? routes.learn
      : lesson === null
        ? routes.topic(topic)
        : withQuery(routes.lesson(topic, lesson), query);
  const scope =
    topic === "all"
      ? t.quickReview
      : lesson === null
        ? getMessages().topics[topic]
        : lessonName(topic, lesson);
  const title = `${scope} · ${t.modes[settings.mode].title}`;

  return (
    <>
      <PageHeader title={title}>
        <ButtonLink href={settingsHref} variant="secondary">
          {t.changeSettings}
        </ButtonLink>
      </PageHeader>
      {session.status === "ready" ? (
        <PracticeSession
          key={session.questions.map((q) => q.wordId).join()}
          questions={session.questions}
          settingsHref={settingsHref}
        />
      ) : session.status === "notEnoughWords" ? (
        <EmptyState
          title={fmt(t.notEnoughWords, { count: QUIZ_OPTION_COUNT })}
          action={
            <ButtonLink
              href={withQuery(
                routes.practice,
                practiceSettingsQuery({ ...settings, mode: "typing" }),
              )}
            >
              {t.tryTyping}
            </ButtonLink>
          }
        />
      ) : (
        <EmptyState title={t.noWords} description={t.noWordsDesc} />
      )}
    </>
  );
}
