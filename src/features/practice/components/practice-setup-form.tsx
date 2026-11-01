import type { ReactNode } from "react";
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
  columns,
  renderLabel,
}: {
  legend: string;
  name: keyof PracticeSettings;
  values: readonly T[];
  selected: T;
  columns: string;
  renderLabel: (value: T) => ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className={`grid gap-2 ${columns}`}>
        {values.map((value) => (
          <label
            key={value}
            className="flex cursor-pointer flex-col rounded-lg border-2 border-zinc-200 px-4 py-3 transition-colors hover:border-indigo-300 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 dark:border-zinc-700 dark:hover:border-indigo-700 dark:has-[:checked]:border-indigo-400 dark:has-[:checked]:bg-indigo-950/50"
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

/** Chọn chế độ, chiều hỏi, số câu rồi mở trang luyện tập (form GET, không cần JavaScript). */
export function PracticeSetupForm({ defaults }: { defaults: PracticeSettings }) {
  const t = getMessages().practice;
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold">{t.setupTitle}</h2>
      <form action={routes.practice} className="flex flex-col gap-6">
        <ChoiceGroup
          legend={t.mode}
          name="mode"
          values={PRACTICE_MODES}
          selected={defaults.mode}
          columns="sm:grid-cols-2"
          renderLabel={(mode) => (
            <>
              <span className="font-medium">{t.modes[mode].title}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
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
          columns="grid-cols-1 sm:grid-cols-3"
          renderLabel={(d) => <span className="font-medium">{t.directions[d]}</span>}
        />
        <ChoiceGroup
          legend={t.count}
          name="count"
          values={QUESTION_COUNTS}
          selected={defaults.count}
          columns="grid-cols-3"
          renderLabel={(n) => (
            <span className="text-center font-medium">{fmt(t.countOption, { count: n })}</span>
          )}
        />
        <Button type="submit" className="self-start px-6 py-2.5 text-base">
          {t.start}
        </Button>
      </form>
    </Card>
  );
}
