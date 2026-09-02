type ScoreCardProps = {
  label: string;
  score: number;
  maxScore: number;
  description?: string;
};

/** Score/progress visual for a total like Kundli Matching's Guna Milan
 * score or a Compatibility score. A soft bar progress built with plain
 * CSS (no chart library), gold/amethyst accent. Accessible via
 * role="meter" with aria-valuenow/min/max — never color-only, since the
 * numeric score is always printed as text too. */
export function ScoreCard({ label, score, maxScore, description }: ScoreCardProps) {
  const safeMax = maxScore > 0 ? maxScore : 1;
  const pct = Math.max(0, Math.min(100, (score / safeMax) * 100));

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-serif text-base text-nav-plum">{label}</p>
        <p className="text-lg font-semibold text-nav-amethyst-deep">
          {score}
          <span className="text-sm font-normal text-nav-plum/60"> / {maxScore}</span>
        </p>
      </div>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxScore}
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-nav-lavender-mist"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-nav-amethyst to-nav-gold transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {description && (
        <p className="mt-3 text-sm leading-relaxed text-nav-plum/75">{description}</p>
      )}
    </div>
  );
}
