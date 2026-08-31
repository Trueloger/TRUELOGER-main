# Daily Horoscope System — Design Spec

Date: 2026-08-31
Status: Approved by user, pending implementation plan.

## 1. Goal

A fully functional, automatically-updating daily horoscope system:
homepage zodiac-card section, 12 dedicated per-sign pages, one daily
server-side generation via OpenRouter, persistent Firestore storage,
date-based (IST) retrieval, mobile carousel, desktop 6×2 grid,
Vercel-deployable.

## 2. Placement (exact)

Current homepage order (`src/app/page.tsx`):

```
HeroCarousel
  <div className="... -mt-[clamp(1.75rem,4vw,3rem)]">  (shared wash div)
    QuickServices        (renders <HeroToServicesCurve/> as its first child)
    ExploreServices
    PersonalizedReportsBanner
    HealingSection
  </div>
PujaSection
ProductsSection
CoursesSection
```

`HeroToServicesCurve` (currently a private function inside
`QuickServices.tsx`) is the "lotus icon / decorative transition
underneath hero" the requirements describe: an ivory dome SVG with a
`LotusIcon` resting on it, revealing Hero through its transparent
areas, sized `h-[clamp(1.75rem,4vw,3rem)]`. The wash div's
`-mt-[clamp(1.75rem,4vw,3rem)]` pulls QuickServices' ivory background
up to interlock with that dome.

**Change:**

1. Extract `HeroToServicesCurve` out of `QuickServices.tsx` into
   `src/components/hero/HeroToServicesCurve.tsx` (pure move — same
   JSX, same export shape). `QuickServices.tsx` imports it from the
   new location if it needs it (it won't, per step 3).
2. New order:
   ```
   HeroCarousel
   HeroToServicesCurve
   HoroscopeSection            (new — bg-nav-ivory, takes over the
                                 -mt-[clamp(1.75rem,4vw,3rem)] tuck
                                 that used to belong to the wash div)
     <div className="... -mt-px">  (wash div — drops the big negative
                                     margin, keeps a plain -mt-px seam
                                     like every other section boundary)
       QuickServices           (no longer renders HeroToServicesCurve)
       ExploreServices
       PersonalizedReportsBanner
       HealingSection
     </div>
   PujaSection
   ProductsSection
   CoursesSection
   ```
3. `QuickServices.tsx` deletes its `<HeroToServicesCurve />` call and
   its local copy of the function. No other change to that file — its
   own rendered output (heading, cards, background) is unchanged.
4. `HoroscopeSection` ends on `nav-ivory` at its bottom edge too
   (matches the wash div's gradient start color), so the
   Horoscope→QuickServices seam is ivory-to-ivory — no gradient
   matching needed there.

## 3. Homepage section — `HoroscopeSection`

Static server component. **No Firestore read** — cards show symbol,
name, and date range only (per requirements §4), not any daily
content. Header follows the same ornament pattern as
`ExploreServices`/`ProductsSection` (`<line/> <LotusIcon/> <line/>`
then serif `h2`), e.g. "Daily Horoscope — Your stars, refreshed every
day."

Renders the shared `ZodiacGrid` (desktop, `md:` and up) and
`ZodiacCarousel` (mobile, below `md:`) — both consume the same static
`ZODIAC_SIGNS` data array.

## 4. Zodiac data & icons

`src/components/horoscope/zodiac-data.ts`:

```ts
export type ZodiacSign = {
  slug: string;        // "aries" — used in URLs and Firestore field names
  name: string;         // "Aries"
  symbol: string;        // "♈" — accessible-name fallback only, never sole visual
  dateRange: string;     // "Mar 21 – Apr 19"
  element: "Fire" | "Earth" | "Air" | "Water";
  Icon: ComponentType<IconProps>;
};
export const ZODIAC_SIGNS: ZodiacSign[]; // 12 entries, Aries → Pisces, in that order
```

`src/components/horoscope/icons.tsx` — 12 custom line-art SVGs, same
stroke language as `LotusIcon`/`quick-services/icons.tsx`
(`viewBox 0 0 24 24`, `stroke="currentColor"`, `fill="none"`, weight
~1.3–1.5, round caps/joins): RamIcon, BullIcon, TwinsIcon, CrabIcon,
LionIcon, MaidenIcon, ScalesIcon, ScorpionIcon, ArcherIcon,
SeaGoatIcon, WaterBearerIcon, FishIcon.

## 5. Card & layout components

`src/components/horoscope/ZodiacCard.tsx` — `Link` to
`/horoscope/{slug}`, ivory/lavender card matching the site's existing
card language (thin `border-nav-lavender-line`, `rounded-2xl`, soft
shadow, icon centered above serif sign name, date range in a smaller
muted line beneath). Equal width/height via the parent grid/flex, not
per-card fixed dimensions.

`src/components/horoscope/ZodiacGrid.tsx` — `hidden md:grid
grid-cols-6 grid-rows-2 gap-4` (or similar), all 12 cards, in the
order Aries→Pisces (fills the 6×2 exactly as specified).

`src/components/horoscope/ZodiacCarousel.tsx` — `md:hidden`. Native
CSS scroll-snap, **zero JS**:
`flex overflow-x-auto snap-x snap-mandatory gap-3`, each card wrapper
`shrink-0 snap-start basis-[calc(25%-...gap)]` sized so exactly 4
cards are visible at 320–430px widths (`clamp()`-based card min-width,
verified at 320/360/375/390/412/430 via local viewport-scaled render
same as prior sections in this codebase — no `resize_window`
dependency). `overscroll-x-contain` on the scroller so mobile Safari's
rubber-banding can't leak into page-level horizontal scroll.

This deliberately does **not** reuse `PujaCarousel`'s peek-carousel
(1 active + 2 peeking, JS track, infinite-loop machinery) — different
UX shape (4 fully visible vs. 1 active) and native scroll-snap avoids
that component's documented history of infinite-loop bugs entirely.

## 6. Routing

- `src/app/horoscope/[sign]/page.tsx` — one template.
  `generateStaticParams` returns the 12 known slugs. `notFound()` for
  any other slug. `export const revalidate = 3600;` (ISR — see §9).
  Renders: zodiac symbol/icon, name, today's date (IST, formatted),
  and the full reading (overview / love / career / finance / health /
  lucky number / lucky color / theme) in a card-based layout matching
  the site's existing "polished reading page" tone — not a blog
  template.
- `src/app/predictions/daily-horoscope/page.tsx` — wires up the
  existing dead nav link (`nav-data.ts` / `quick-services-data.ts`
  already point here). Renders the same heading pattern + `ZodiacGrid`
  + `ZodiacCarousel` as the homepage section (full 12-sign index, no
  daily content on this page either).

## 7. Server-side data layer

`src/lib/firebase-admin.ts` — singleton Admin SDK init from
`FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` /
`FIREBASE_ADMIN_PROJECT_ID`, guarded against re-init on hot reload
(`getApps().length` check). Exports a `Firestore` instance. Move
`firebase-admin` from `devDependencies` to `dependencies` in
`package.json` — it's a runtime dependency (used in Route Handlers /
RSC at request time), not a build-time-only tool; leaving it in
`devDependencies` risks a production install pruning it depending on
install flags.

`src/lib/horoscope/types.ts`:

```ts
export type SignReading = {
  overview: string;
  love: string;
  career: string;
  finance: string;
  health: string;
  luckyNumber: number;
  luckyColor: string;
  theme: string;         // short "theme of the day" line
  mood?: string;          // optional energy/mood note
  compatibility?: string; // optional compatibility note
};
export type DailyHoroscopeDoc = {
  date: string;           // "YYYY-MM-DD", IST calendar date
  generatedAt: string;    // ISO timestamp
  model: string;
  signs: Record<string, SignReading>; // keyed by slug, all 12 present
};
```

`src/lib/horoscope/date.ts` — `getTodayIST(): string` (`YYYY-MM-DD` in
`Asia/Kolkata`, via `Intl.DateTimeFormat` — no new date library).

`src/lib/horoscope/openrouter.ts` — builds the generation prompt (see
§8), calls OpenRouter's chat completions endpoint with
`model: process.env.OPENROUTER_MODEL_FREE` (this env var holds the id
`"minimax/minimax-m3"` — the name is a pre-existing naming convention
about *which site features* are billed as "free-tier", not a
statement about model cost; it is **not** repurposed here) and
`Authorization: Bearer ${process.env.OPENROUTER_API_KEY_PAID}` (per
explicit instruction — `OPENROUTER_API_KEY_FREE` is reserved for
other, already-planned free-tier features and must not be touched by
this system). Comment this clearly in code — the names look
mismatched otherwise. Requests JSON output; parses and validates the
response against `SignReading`'s shape (manual type-guard, no new
validation library) for all 12 signs; on a malformed response, retries
once with a stricter re-prompt, then throws.

`src/lib/horoscope/store.ts`:

```ts
getDailyHoroscopes(date: string): Promise<DailyHoroscopeDoc | null>;
generateDailyHoroscopes(date: string): Promise<DailyHoroscopeDoc>;
  // calls OpenRouter for all 12 signs, validates, writes via
  // doc(date).create() (NOT set()) so a losing concurrent caller gets
  // a rejected write instead of clobbering/duplicating; on that
  // rejection, re-read and return the winner's doc.
getOrGenerateDailyHoroscopes(date: string): Promise<DailyHoroscopeDoc>;
  // read-through: getDailyHoroscopes → if null, generateDailyHoroscopes
```

Firestore layout: collection `dailyHoroscopes`, doc id = IST date
string, one doc per day holding all 12 signs (single read serves every
visitor of that day; single write per day in the common case).

## 8. Generation prompt (server-side only, never sent to client)

Per-sign, structured prompt including the sign name, its date range,
element, today's IST date, and explicit instructions to: write a
polished daily astrology reading in the site's warm/spiritual/premium
tone; cover overview, love, career, finance, health, lucky number
(1–99), lucky color, and a one-line theme; avoid fear-based
predictions, absolute guarantees, medical diagnosis, extreme financial
claims, guaranteed outcomes, and generic phrasing that would repeat
near-verbatim across other signs; return **strict JSON only**, matching
the `SignReading` shape. All 12 signs are requested together in one
call (one structured JSON object keyed by slug) rather than 12
separate calls — cheaper, faster, and the model can naturally avoid
repeating itself across signs when it can see all 12 at once.

## 9. Freshness / caching

- `/horoscope/[sign]` and `/predictions/daily-horoscope`:
  `export const revalidate = 3600;` (hourly ISR check — ample given
  content only actually changes once/day, avoids a Firestore read on
  literally every request).
- Homepage `HoroscopeSection`: no data fetch at all (§3), so no
  revalidation concern.

## 10. Cron

`vercel.json` (new file):

```json
{
  "crons": [
    { "path": "/api/cron/generate-horoscopes", "schedule": "35 18 * * *" }
  ]
}
```

`35 18 * * *` UTC = 00:05 IST daily — 5 minutes past IST midnight, a
safety buffer past the exact rollover.

`src/app/api/cron/generate-horoscopes/route.ts` (`GET`): checks
`Authorization: Bearer ${process.env.CRON_SECRET}` (Vercel
auto-injects this header on cron-triggered requests when
`CRON_SECRET` is set — already provisioned), 401s otherwise; calls
`getOrGenerateDailyHoroscopes(getTodayIST())`; returns the resulting
doc's `date`/`generatedAt`/sign count as JSON, or a 500 with the error
message on failure.

**Self-healing:** the same `getOrGenerateDailyHoroscopes` call is what
the `/horoscope/[sign]` and `/predictions/daily-horoscope` pages use
directly. Vercel Hobby-tier cron can fire up to ~59 minutes late (or,
rarely, not at all); because the read path and the cron path share the
exact same read-through function, the first real visitor after IST
midnight triggers generation itself if cron hasn't yet — no visitor
ever sees empty content because of cron slippage.

## 11. Error handling

- OpenRouter call fails / returns unparseable JSON after retry:
  `generateDailyHoroscopes` throws.
- Cron route: catches, returns 500 with the error (visible in Vercel's
  cron logs); does not write partial/invalid data.
- Page-level (`/horoscope/[sign]`, `/predictions/daily-horoscope`,
  and the index): wrap the `getOrGenerateDailyHoroscopes` call in
  try/catch; on failure render a small in-page fallback state ("The
  stars are aligning — today's reading will be ready shortly.")
  instead of throwing, so a transient OpenRouter/Firestore outage
  degrades gracefully rather than 500ing the page.
- Unknown `[sign]` slug: `notFound()` → standard Next.js 404.

## 12. Secrets

New `.env.example` (none exists today) documenting every variable
already present in `.env.local` (names only, empty values), including
`OPENROUTER_API_KEY_FREE`, `OPENROUTER_API_KEY_PAID`,
`OPENROUTER_MODEL_FREE`, `OPENROUTER_MODEL_PAID`, `CRON_SECRET`, the
`FIREBASE_ADMIN_*` trio, and the pre-existing unrelated vars
(`ADMIN_*`, `CASHFREE_*`, `WHATSAPP_*`, Firebase client `NEXT_PUBLIC_*`
vars) so the file is a complete reference, not just the new ones.
`OPENROUTER_API_KEY_PAID` and `FIREBASE_ADMIN_*` are read only inside
`src/lib/*` modules imported exclusively from Route Handlers / Server
Components — never from a `"use client"` file — so they never enter
the client bundle.

## 13. Verification plan

No test runner exists in this project (confirmed via `package.json`);
consistent with how every other section in this codebase has been
verified so far:

- `npx tsc --noEmit && npx eslint src` after each implementation stage.
- Manual dry-run of `generateDailyHoroscopes` (a small throwaway
  script or hitting the cron route locally with `CRON_SECRET`) to
  confirm real OpenRouter output parses and validates.
- Browser check: homepage section (desktop 6×2 grid, mobile 4-visible
  swipe carousel at 320/360/375/390/412/430px), `/horoscope/aries`
  (and one or two other signs) for reading-page layout, and
  `/predictions/daily-horoscope` for the index page — same
  viewport-scaled-render approach used for prior sections when
  `resize_window` is unreliable.
- Confirm the Horoscope→QuickServices placement change didn't alter
  QuickServices' own rendered output (visual diff of that section
  before/after).

## 14. Out of scope

- Weekly/monthly horoscope pages (nav already lists them; not part of
  this build).
- Personalized (birth-chart-based) readings — this is sign-level daily
  content only.
- Compatibility matching page, admin UI for editing/regenerating
  horoscopes, historical archive/browse of past days' readings.
