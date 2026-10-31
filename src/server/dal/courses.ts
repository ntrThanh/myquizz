import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { hasRole, type Actor } from "@/server/auth/roles";
import { collections, type ContentStatus, type CourseDoc } from "@/server/db/collections";
import { pageArgs, type Page, type PageInput } from "@/server/dal/common";

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ContentStatus;
  lessonCount: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  status: ContentStatus;
  wordCount: number;
  /** Số từ người dùng đã thêm vào danh sách học (0 với khách). */
  learningCount: number;
}

export interface CourseDetail extends CourseSummary {
  lessons: LessonSummary[];
}

/** Khách và user chỉ thấy bản published; editor/admin thấy cả draft. */
function visible(actor: Actor | null) {
  return hasRole(actor, "editor") ? {} : { status: "published" as const };
}

export async function listCourses(
  actor: Actor | null,
  input: PageInput = {},
): Promise<Page<CourseSummary>> {
  const { page, pageSize, skip } = pageArgs(input);
  const filter: Filter<CourseDoc> = visible(actor);
  const [docs, total] = await Promise.all([
    collections
      .courses()
      .find(filter)
      .sort({ sort: 1, _id: 1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    collections.courses().countDocuments(filter),
  ]);
  const counts = await collections
    .lessons()
    .aggregate<{ _id: ObjectId; n: number }>([
      { $match: { courseId: { $in: docs.map((d) => d._id) }, ...visible(actor) } },
      { $group: { _id: "$courseId", n: { $sum: 1 } } },
    ])
    .toArray();
  const countById = new Map(counts.map((c) => [c._id.toHexString(), c.n]));
  return {
    items: docs.map((d) => ({
      id: d._id.toHexString(),
      slug: d.slug,
      title: d.title,
      description: d.description,
      status: d.status,
      lessonCount: countById.get(d._id.toHexString()) ?? 0,
    })),
    page,
    pageSize,
    total,
  };
}

export async function getCourseBySlug(
  actor: Actor | null,
  slug: string,
): Promise<CourseDetail | null> {
  const course = await collections.courses().findOne({ slug, ...visible(actor) });
  if (!course) return null;

  const lessons = await collections
    .lessons()
    .find({ courseId: course._id, ...visible(actor) })
    .sort({ sort: 1, _id: 1 })
    .limit(200)
    .toArray();
  const lessonIds = lessons.map((l) => l._id);

  const [wordCounts, learningCounts] = await Promise.all([
    collections
      .words()
      .aggregate<{ _id: ObjectId; n: number }>([
        { $match: { lessonId: { $in: lessonIds }, ...visible(actor) } },
        { $group: { _id: "$lessonId", n: { $sum: 1 } } },
      ])
      .toArray(),
    actor
      ? collections
          .userWordProgress()
          .aggregate<{ _id: ObjectId; n: number }>([
            // userId luôn lấy từ session.
            { $match: { userId: new ObjectId(actor.id), lessonId: { $in: lessonIds } } },
            { $group: { _id: "$lessonId", n: { $sum: 1 } } },
          ])
          .toArray()
      : [],
  ]);
  const words = new Map(wordCounts.map((c) => [c._id.toHexString(), c.n]));
  const learning = new Map(learningCounts.map((c) => [c._id.toHexString(), c.n]));

  return {
    id: course._id.toHexString(),
    slug: course.slug,
    title: course.title,
    description: course.description,
    status: course.status,
    lessonCount: lessons.length,
    lessons: lessons.map((l) => ({
      id: l._id.toHexString(),
      title: l.title,
      status: l.status,
      wordCount: words.get(l._id.toHexString()) ?? 0,
      learningCount: learning.get(l._id.toHexString()) ?? 0,
    })),
  };
}
