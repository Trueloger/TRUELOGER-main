// src/components/horoscope/HoroscopeReading.tsx
import type { ComponentType, SVGProps } from "react";
import type { SignReading } from "@/lib/horoscope/types";
import type { ZodiacMeta } from "@/lib/horoscope/zodiac";

type Props = {
  meta: ZodiacMeta;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  reading: SignReading;
  dateLabel: string;
};

/** The full daily reading for one sign — overview, the four life-area
 * fields, lucky number/color, and optional mood/compatibility. Purely
 * presentational; the page component (page.tsx) handles data fetching
 * and the not-found/fallback states. */
export function HoroscopeReading({ meta, Icon, reading, dateLabel }: Props) {
  const fields: { label: string; value: string }[] = [
    { label: "Love", value: reading.love },
    { label: "Career", value: reading.career },
    { label: "Finance", value: reading.finance },
    { label: "Health & Wellbeing", value: reading.health },
  ];

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-16">
      <div className="text-center">
        <Icon className="mx-auto h-12 w-12 text-nav-amethyst-deep" strokeWidth={1.3} />
        <h1 className="mt-3 font-serif text-3xl text-nav-plum sm:text-4xl">
          {meta.name}
        </h1>
        <p className="mt-1 text-sm text-nav-plum/60">
          {meta.dateRange} · {dateLabel}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist p-6 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:p-8">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-nav-amethyst">
          {reading.theme}
        </p>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-nav-violet">
          {reading.overview}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-xl border border-nav-lavender-line bg-nav-pearl p-4"
          >
            <dt className="font-serif text-base text-nav-amethyst-deep">
              {field.label}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-nav-plum/85">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-nav-gold/30 bg-nav-lavender-mist px-5 py-4 text-sm text-nav-plum">
        <span>
          Lucky number <strong className="text-nav-amethyst-deep">{reading.luckyNumber}</strong>
        </span>
        <span className="h-4 w-px bg-nav-lavender-line" aria-hidden="true" />
        <span>
          Lucky color <strong className="text-nav-amethyst-deep">{reading.luckyColor}</strong>
        </span>
        {reading.mood && (
          <>
            <span className="h-4 w-px bg-nav-lavender-line" aria-hidden="true" />
            <span>{reading.mood}</span>
          </>
        )}
      </div>

      {reading.compatibility && (
        <p className="mt-6 text-center text-sm italic text-nav-plum/70">
          {reading.compatibility}
        </p>
      )}
    </article>
  );
}
