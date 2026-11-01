"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fmt, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";
import { DEFAULT_TOPIC, MAX_TOPICS_PER_WORD, TOPIC_GROUPS, type TopicGroup } from "@/lib/topics";
import { CONTENT_STATUSES } from "@/lib/types";
import { Alert, Button, ButtonLink, Card, inputClass } from "@/components/ui";
import { createWordAction, updateWordAction } from "@/features/words/actions";
import { WORD_LIMITS, type WordValues } from "@/features/words/schemas";

const t = getMessages().admin.word;
const common = getMessages().common;
const { topics: topicLabels, topicGroups } = getMessages();

const EMPTY: WordValues = {
  word: "",
  meaningVi: "",
  ipa: "",
  example: "",
  topics: [DEFAULT_TOPIC],
  status: "published",
};

function Field({
  id,
  label,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-label-secondary"> ({t.optional})</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-label-secondary">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Thêm từ (không có `id`) hoặc sửa từ (có `id`). Server validate lại bằng Zod. */
export function WordForm({ id, initial = EMPTY }: { id?: string; initial?: WordValues }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(form: FormData) {
    setError(null);
    const values = {
      word: String(form.get("word") ?? ""),
      meaningVi: String(form.get("meaningVi") ?? ""),
      ipa: String(form.get("ipa") ?? ""),
      example: String(form.get("example") ?? ""),
      topics: form.getAll("topics").map(String),
      status: String(form.get("status") ?? ""),
    };
    start(async () => {
      const res = id ? await updateWordAction({ id, ...values }) : await createWordAction(values);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(routes.adminWords);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl p-6">
      <form action={onSubmit} className="flex flex-col gap-5">
        <Field id="word" label={t.word}>
          <input
            id="word"
            name="word"
            required
            maxLength={WORD_LIMITS.word}
            defaultValue={initial.word}
            lang="en"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field id="meaningVi" label={t.meaningVi} hint={t.meaningHint}>
          <input
            id="meaningVi"
            name="meaningVi"
            required
            maxLength={WORD_LIMITS.meaningVi}
            defaultValue={initial.meaningVi}
            aria-describedby="meaningVi-hint"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field id="ipa" label={t.ipa} optional>
          <input
            id="ipa"
            name="ipa"
            maxLength={WORD_LIMITS.ipa}
            defaultValue={initial.ipa}
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field id="example" label={t.example} optional>
          <textarea
            id="example"
            name="example"
            rows={2}
            maxLength={WORD_LIMITS.example}
            defaultValue={initial.example}
            lang="en"
            className={inputClass}
          />
        </Field>
        <fieldset className="flex flex-col gap-3" aria-describedby="topics-hint">
          <legend className="text-sm font-medium">{t.topic}</legend>
          <p id="topics-hint" className="-mt-1 text-xs text-label-secondary">
            {fmt(t.topicsHint, { count: MAX_TOPICS_PER_WORD })}
          </p>
          {(Object.keys(TOPIC_GROUPS) as TopicGroup[]).map((group) => (
            <div key={group} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-label-secondary uppercase">
                {topicGroups[group]}
              </p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                {TOPIC_GROUPS[group].map((topic) => (
                  <label key={topic} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="topics"
                      value={topic}
                      defaultChecked={initial.topics.includes(topic)}
                      className="size-4 accent-accent"
                    />
                    {topicLabels[topic]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        <Field id="status" label={t.status} hint={t.statusHint}>
          <select
            id="status"
            name="status"
            defaultValue={initial.status}
            aria-describedby="status-hint"
            className={inputClass}
          >
            {CONTENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.statuses[s]}
              </option>
            ))}
          </select>
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {common.save}
          </Button>
          <ButtonLink href={routes.adminWords} variant="secondary">
            {common.cancel}
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
