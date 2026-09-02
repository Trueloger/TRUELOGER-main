type InterpretationCardProps = {
  title: string;
  content: string;
};

/** A titled card for one AI-generated interpretation section. Splits
 * `content` on blank lines so a multi-paragraph interpretation renders
 * as real separate <p> elements instead of one run-on block. Renders
 * nothing when given no content. */
export function InterpretationCard({ title, content }: InterpretationCardProps) {
  if (!content) return null;

  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 sm:p-6">
      <h3 className="font-serif text-lg text-nav-amethyst-deep">{title}</h3>
      <div className="mt-2.5 space-y-3 text-sm leading-relaxed text-nav-plum/85">
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
