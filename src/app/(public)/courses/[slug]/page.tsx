import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fmt, getMessages } from "@/lib/i18n";
import { getActor } from "@/server/auth/session";
import { getCourseBySlug } from "@/server/dal/courses";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { StartLessonButton } from "@/features/study/components/start-lesson-button";

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await getCourseBySlug(await getActor(), (await params).slug);
  return { title: course?.title ?? getMessages().common.notFound };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const t = getMessages();
  const { slug } = await params;
  const actor = await getActor();
  const course = await getCourseBySlug(actor, slug);
  if (!course) notFound();

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          {course.status === "draft" && <Badge tone="amber">{t.common.draft}</Badge>}
        </div>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{course.description}</p>
      </div>
      {course.lessons.length === 0 ? (
        <EmptyState title={t.courses.noLessons} />
      ) : (
        <ul className="flex flex-col gap-3">
          {course.lessons.map((l) => (
            <li key={l.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">{l.title}</h2>
                    {l.status === "draft" && <Badge tone="amber">{t.common.draft}</Badge>}
                  </div>
                  <p className="text-sm text-zinc-500">
                    {actor && l.learningCount > 0
                      ? fmt(t.courses.learning, { count: l.learningCount, total: l.wordCount })
                      : fmt(t.courses.words, { count: l.wordCount })}
                  </p>
                </div>
                {actor ? (
                  <StartLessonButton
                    lessonId={l.id}
                    courseSlug={course.slug}
                    done={l.wordCount > 0 && l.learningCount >= l.wordCount}
                  />
                ) : (
                  <ButtonLink variant="secondary" href={`/login?next=/courses/${course.slug}`}>
                    {t.courses.loginToLearn}
                  </ButtonLink>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
