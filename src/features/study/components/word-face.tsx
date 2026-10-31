import type { StudyCard } from "@/server/dal/study";

export function WordFace({
  card,
  size = "lg",
}: {
  card: Pick<StudyCard, "word" | "ipa">;
  size?: "lg" | "md";
}) {
  return (
    <div className="text-center">
      <p
        className={`font-semibold tracking-tight ${size === "lg" ? "text-4xl" : "text-3xl"}`}
        lang="en"
      >
        {card.word}
      </p>
      {card.ipa && <p className="mt-1 text-zinc-500">{card.ipa}</p>}
    </div>
  );
}
