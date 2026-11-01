import type { CSSProperties, ReactNode } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import {
  DIRECTION_SETTINGS,
  PRACTICE_MODES,
  QUESTION_COUNTS,
  QUIZ_OPTION_COUNT,
  type PracticeSettings,
} from "@/lib/practice/config";
import { routes } from "@/lib/routes";
import { Button, Card } from "@/components/ui";

function ChoiceGroup<T extends string | number>({
  legend,
  name,
  values,
  selected,
  layout,
  renderLabel,
}: {
  legend: string;
  name: keyof PracticeSettings;
  values: readonly T[];
  selected: T;
  /** `tiles`: ô lớn có mô tả; `segmented`: thanh chọn kiểu iOS cho lựa chọn ngắn. */
  layout: "tiles" | "segmented";
  renderLabel: (value: T) => ReactNode;
}) {
  const segmented = layout === "segmented";
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-label-secondary">{legend}</legend>
      <div
        className={segmented ? "segmented" : "grid gap-3 sm:grid-cols-2"}
        style={segmented ? ({ "--n": values.length } as CSSProperties) : undefined}
      >
        {values.map((value) => (
          <label
            key={value}
            className={
              segmented
                ? "press flex min-h-10 cursor-pointer items-center justify-center rounded-[10px] px-2 text-center text-sm font-medium text-label-secondary has-[:checked]:text-label"
                : "press flex cursor-pointer flex-col gap-0.5 rounded-2xl bg-fill-4 px-4 py-3.5 outline-2 outline-transparent -outline-offset-2 hover:bg-fill-3 has-[:checked]:bg-accent/12 has-[:checked]:outline-accent has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/25"
            }
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={value === selected}
              className="sr-only"
            />
            {renderLabel(value)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Chọn chế độ (gõ đáp án / trắc nghiệm), chiều hỏi, số câu rồi mở trang luyện tập (form GET,
 * không cần JavaScript). Chủ đề và bài lấy từ `defaults`, gửi kèm dưới dạng field ẩn.
 */
export function PracticeSetupForm({ defaults }: { defaults: PracticeSettings }) {
  const t = getMessages().practice;
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">{t.setupTitle}</h2>
      <form action={routes.practice} className="flex flex-col gap-6">
        <input type="hidden" name="topic" value={defaults.topic} />
        {defaults.lesson !== null && <input type="hidden" name="lesson" value={defaults.lesson} />}
        <ChoiceGroup
          legend={t.mode}
          name="mode"
          values={PRACTICE_MODES}
          selected={defaults.mode}
          layout="tiles"
          renderLabel={(mode) => (
            <>
              <span className="font-semibold">{t.modes[mode].title}</span>
              <span className="text-sm text-label-secondary">
                {fmt(t.modes[mode].desc, { count: QUIZ_OPTION_COUNT })}
              </span>
            </>
          )}
        />
        <ChoiceGroup
          legend={t.direction}
          name="direction"
          values={DIRECTION_SETTINGS}
          selected={defaults.direction}
          layout="segmented"
          renderLabel={(d) => t.directions[d]}
        />
        <ChoiceGroup
          legend={t.count}
          name="count"
          values={QUESTION_COUNTS}
          selected={defaults.count}
          layout="segmented"
          renderLabel={(n) => fmt(t.countOption, { count: n })}
        />
        <Button type="submit" className="self-start px-7 py-3 text-base">
          {t.start}
        </Button>
      </form>
    </Card>
  );
}
