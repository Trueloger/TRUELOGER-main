# Daily Horoscope System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fully functional, automatically-updating daily horoscope system — homepage zodiac-card section, 12 per-sign reading pages, once-daily server-side generation via OpenRouter, persistent Firestore storage, IST date-based retrieval, mobile carousel, desktop 6×2 grid.

**Architecture:** Pure data/validation modules under `src/lib/horoscope/`, a Firestore-backed read-through store (`getOrGenerateDailyHoroscopes`) shared by a Vercel Cron route and every page that needs today's readings, and presentational components under `src/components/horoscope/` consumed by the homepage section and two new routes (`/horoscope/[sign]`, `/predictions/daily-horoscope`).

**Tech Stack:** Next.js 16 App Router (Server Components, Route Handlers, ISR via `revalidate`), Firestore via `firebase-admin` (already a dependency), OpenRouter chat completions API, Tailwind CSS v4, native CSS scroll-snap (no new carousel library), Node 24's built-in `.ts` execution for manual verification scripts (no test framework exists in this repo — see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-08-31-daily-horoscope-design.md`

## Global Constraints

- No test runner exists in this repo (`package.json` has no test script, no jest/vitest/etc.). Every task's verification uses `npx tsc --noEmit` + `npx eslint src`, plus one of: a `node <file>.ts` script using `node:assert/strict` for pure logic (Node 24 runs `.ts` natively — confirmed in this environment), a manual dry-run script for anything hitting Firestore/OpenRouter, or a browser check for UI. This matches the spec's §13 Verification Plan and how every prior section of this codebase was verified.
- `tsconfig.json` gets `"allowImportingTsExtensions": true` added (Task 1) — required so `src/lib/horoscope/*.ts` files can import each other with explicit `.ts` extensions, which is what lets their test scripts run directly via plain `node` without a build step. Confirmed via a local probe: `tsc --noEmit` errors with `TS5097` on `.ts`-extension imports without this flag.
- Within `src/lib/horoscope/*.ts` and `src/lib/firebase-admin.ts`, cross-module imports use relative paths with explicit `.ts` extensions (e.g. `./zodiac.ts`, `../firebase-admin.ts`), never the `@/` alias — plain `node` (used to run the test/dry-run scripts) has no idea what `@/` means; that alias only exists inside Next's bundler. Route Handlers, pages, and components (never executed via plain `node`) keep using `@/...` as the rest of this codebase already does.
- Model: `minimax/minimax-m3` (the id already stored in `OPENROUTER_MODEL_FREE`), called with `OPENROUTER_API_KEY_PAID` — per explicit user instruction. `OPENROUTER_API_KEY_FREE` is reserved for other, unrelated free-tier features and must not be touched.
- Firestore: collection `dailyHoroscopes`, doc id = IST calendar date (`YYYY-MM-DD`), one doc per day holding all 12 signs.
- Cron: `35 18 * * *` (UTC) = 00:05 IST daily, hits `/api/cron/generate-horoscopes`, guarded by `Authorization: Bearer $CRON_SECRET` (Vercel auto-injects this).
- ISR: `/horoscope/[sign]` and `/predictions/daily-horoscope` use `export const revalidate = 3600;`.
- Desktop layout: `grid-cols-6 grid-rows-2`, all 12 cards visible, no horizontal scroll. Mobile: native CSS scroll-snap carousel, exactly 4 cards visible per view at 320–430px, no page-level horizontal scroll.
- Homepage placement: `HeroCarousel` → `HeroToServicesCurve` (moved out of `QuickServices.tsx` into its own file, otherwise unchanged) → `HoroscopeSection` (new, owns the `-mt-[clamp(1.75rem,4vw,3rem)]` tuck that used to belong to the wash div) → the existing wash div (now just `-mt-px`) wrapping `QuickServices`/`ExploreServices`/`PersonalizedReportsBanner`/`HealingSection` → `PujaSection` → `ProductsSection` → `CoursesSection`.
- `firebase-admin` moves from `devDependencies` to `dependencies` in `package.json` (Task 6) — it's used at runtime, not just build time.
- `.gitignore`'s `.env*` line gets a `!.env.example` negation added (Task 1) so the new `.env.example` actually gets committed.
- Secrets (`OPENROUTER_API_KEY_PAID`, `FIREBASE_ADMIN_*`, `CRON_SECRET`) are read only inside `src/lib/*` modules imported exclusively from Route Handlers / Server Components — never from a `"use client"` file.

---

### Task 1: Foundation — tsconfig, gitignore, `.env.example`

**Files:**
- Modify: `tsconfig.json`
- Modify: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: `allowImportingTsExtensions: true` compiler option, relied on by every task under `src/lib/horoscope/`.

- [ ] **Step 1: Add `allowImportingTsExtensions` to `tsconfig.json`**

In `tsconfig.json`, inside `compilerOptions`, add the line `"allowImportingTsExtensions": true,` right after `"noEmit": true,`.

- [ ] **Step 2: Verify it fixes the extension-import error**

```bash
mkdir -p src/lib/_probe
printf 'export const x = 1;\n' > src/lib/_probe/a.ts
printf 'import { x } from "./a.ts";\nconsole.log(x);\n' > src/lib/_probe/b.ts
npx tsc --noEmit
rm -rf src/lib/_probe
```
Expected: no `TS5097` error (command exits with no output referencing `_probe`).

- [ ] **Step 3: Allow `.env.example` past the blanket `.env*` ignore**

In `.gitignore`, change:
```
# env files (can opt-in for committing if needed)
.env*
```
to:
```
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 4: Create `.env.example`**

```bash
# Firebase Admin (Firestore) — server-side only, never exposed to the client
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Firebase client SDK (public config, safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_USE_FIRESTORE_SERVICES=

# OpenRouter — server-side only, never exposed to the client.
# OPENROUTER_API_KEY_FREE is reserved for other free-tier site features.
# The daily horoscope generator uses OPENROUTER_API_KEY_PAID with the
# model id in OPENROUTER_MODEL_FREE (minimax/minimax-m3) — see
# src/lib/horoscope/openrouter.ts for why that naming isn't a typo.
OPENROUTER_API_KEY_FREE=
OPENROUTER_API_KEY_PAID=
OPENROUTER_MODEL_FREE=
OPENROUTER_MODEL_PAID=

# Vercel Cron auth — Vercel auto-injects this as a Bearer token on
# cron-triggered requests when this env var is set.
CRON_SECRET=

# Admin login
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=

# Cashfree payments
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
NEXT_PUBLIC_CASHFREE_MODE=

# WhatsApp Business API
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
```
Write this to `.env.example` at the repo root.

- [ ] **Step 5: Verify git sees it as trackable**

Run: `git check-ignore .env.example`
Expected: no output and a non-zero exit (meaning it is NOT ignored). If it prints the path, the negation in Step 3 didn't take — double check `.env*` comes before `!.env.example` in the file.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json .gitignore .env.example
git commit -m "chore: enable .ts-extension imports, add .env.example

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 2: `src/lib/horoscope/zodiac.ts` — zodiac metadata + slug guard

**Files:**
- Create: `src/lib/horoscope/zodiac.ts`
- Test: `src/lib/horoscope/zodiac.test.ts`

**Interfaces:**
- Produces: `ZodiacSlug` (union type), `ZodiacMeta` (type), `ZODIAC_ORDER: ZodiacSlug[]` (12 entries, Aries→Pisces), `ZODIAC_META: Record<ZodiacSlug, ZodiacMeta>`, `isZodiacSlug(value: string): value is ZodiacSlug`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/horoscope/zodiac.test.ts
import assert from "node:assert/strict";
import { ZODIAC_ORDER, ZODIAC_META, isZodiacSlug } from "./zodiac.ts";

assert.strictEqual(ZODIAC_ORDER.length, 12, "must have exactly 12 signs");
assert.deepStrictEqual(ZODIAC_ORDER, [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);

for (const slug of ZODIAC_ORDER) {
  const meta = ZODIAC_META[slug];
  assert.ok(meta, `missing meta for ${slug}`);
  assert.strictEqual(meta.slug, slug);
  assert.ok(meta.name.length > 0, `${slug} missing name`);
  assert.ok(meta.dateRange.length > 0, `${slug} missing dateRange`);
  assert.ok(
    ["Fire", "Earth", "Air", "Water"].includes(meta.element),
    `${slug} has invalid element`
  );
}

assert.strictEqual(isZodiacSlug("aries"), true);
assert.strictEqual(isZodiacSlug("pisces"), true);
assert.strictEqual(isZodiacSlug("dragon"), false);
assert.strictEqual(isZodiacSlug(""), false);

console.log("zodiac.test.ts: all assertions passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/lib/horoscope/zodiac.test.ts`
Expected: FAIL — `Cannot find module '.../zodiac.ts'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/horoscope/zodiac.ts
// Canonical zodiac metadata, shared by server logic (validation, static
// params, prompt building) and UI data (see
// src/components/horoscope/zodiac-ui-data.ts, which attaches icon
// components to this). Kept dependency-free (no React import) so
// server-only modules can import it without pulling UI code in.

export type ZodiacSlug =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type ZodiacMeta = {
  slug: ZodiacSlug;
  name: string;
  symbol: string;
  dateRange: string;
  element: "Fire" | "Earth" | "Air" | "Water";
};

export const ZODIAC_ORDER: ZodiacSlug[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

export const ZODIAC_META: Record<ZodiacSlug, ZodiacMeta> = {
  aries: { slug: "aries", name: "Aries", symbol: "♈", dateRange: "Mar 21 – Apr 19", element: "Fire" },
  taurus: { slug: "taurus", name: "Taurus", symbol: "♉", dateRange: "Apr 20 – May 20", element: "Earth" },
  gemini: { slug: "gemini", name: "Gemini", symbol: "♊", dateRange: "May 21 – Jun 20", element: "Air" },
  cancer: { slug: "cancer", name: "Cancer", symbol: "♋", dateRange: "Jun 21 – Jul 22", element: "Water" },
  leo: { slug: "leo", name: "Leo", symbol: "♌", dateRange: "Jul 23 – Aug 22", element: "Fire" },
  virgo: { slug: "virgo", name: "Virgo", symbol: "♍", dateRange: "Aug 23 – Sep 22", element: "Earth" },
  libra: { slug: "libra", name: "Libra", symbol: "♎", dateRange: "Sep 23 – Oct 22", element: "Air" },
  scorpio: { slug: "scorpio", name: "Scorpio", symbol: "♏", dateRange: "Oct 23 – Nov 21", element: "Water" },
  sagittarius: { slug: "sagittarius", name: "Sagittarius", symbol: "♐", dateRange: "Nov 22 – Dec 21", element: "Fire" },
  capricorn: { slug: "capricorn", name: "Capricorn", symbol: "♑", dateRange: "Dec 22 – Jan 19", element: "Earth" },
  aquarius: { slug: "aquarius", name: "Aquarius", symbol: "♒", dateRange: "Jan 20 – Feb 18", element: "Air" },
  pisces: { slug: "pisces", name: "Pisces", symbol: "♓", dateRange: "Feb 19 – Mar 20", element: "Water" },
};

export function isZodiacSlug(value: string): value is ZodiacSlug {
  return (ZODIAC_ORDER as string[]).includes(value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/lib/horoscope/zodiac.test.ts`
Expected: prints `zodiac.test.ts: all assertions passed`, exit code 0.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/horoscope/zodiac.ts src/lib/horoscope/zodiac.test.ts
git commit -m "feat(horoscope): add zodiac metadata and slug guard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 3: `src/lib/horoscope/types.ts` — reading + doc types

**Files:**
- Create: `src/lib/horoscope/types.ts`

**Interfaces:**
- Consumes: `ZodiacSlug` from `./zodiac.ts` (Task 2).
- Produces: `SignReading` (type), `SIGN_READING_REQUIRED_STRING_KEYS` (const array), `DailyHoroscopeDoc` (type). Relied on by Tasks 4, 7, 8, 14.

This is a types-only file (no runtime logic to unit-test) — verification is `tsc`/`eslint` only.

- [ ] **Step 1: Write the file**

```ts
// src/lib/horoscope/types.ts
import type { ZodiacSlug } from "./zodiac.ts";

export type SignReading = {
  overview: string;
  love: string;
  career: string;
  finance: string;
  health: string;
  luckyNumber: number;
  luckyColor: string;
  theme: string;
  mood?: string;
  compatibility?: string;
};

// The string-valued required fields, used by validate.ts to check
// presence/type generically. luckyNumber is handled separately there
// (numeric, not string). mood/compatibility are optional — not listed.
export const SIGN_READING_REQUIRED_STRING_KEYS = [
  "overview", "love", "career", "finance", "health", "luckyColor", "theme",
] as const;

export type DailyHoroscopeDoc = {
  date: string; // "YYYY-MM-DD", IST calendar date
  generatedAt: string; // ISO timestamp
  model: string;
  signs: Record<ZodiacSlug, SignReading>;
};
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/horoscope/types.ts
git commit -m "feat(horoscope): add SignReading and DailyHoroscopeDoc types

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 4: `src/lib/horoscope/validate.ts` — validate LLM output

**Files:**
- Create: `src/lib/horoscope/validate.ts`
- Test: `src/lib/horoscope/validate.test.ts`

**Interfaces:**
- Consumes: `ZODIAC_ORDER`, `ZodiacSlug` from `./zodiac.ts`; `SignReading`, `SIGN_READING_REQUIRED_STRING_KEYS` from `./types.ts`.
- Produces: `isValidSignReading(value: unknown): value is SignReading`, `validateGeneratedSet(raw: unknown): Record<ZodiacSlug, SignReading> | null`. Relied on by Task 7.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/horoscope/validate.test.ts
import assert from "node:assert/strict";
import { isValidSignReading, validateGeneratedSet } from "./validate.ts";
import { ZODIAC_ORDER } from "./zodiac.ts";

const goodReading = {
  overview: "A day of clarity and forward motion.",
  love: "Warmth returns to a close relationship.",
  career: "A well-timed idea earns notice.",
  finance: "Steady, no impulsive spending today.",
  health: "Good energy; a short walk helps focus.",
  luckyNumber: 7,
  luckyColor: "Indigo",
  theme: "Clarity in motion",
};

assert.strictEqual(isValidSignReading(goodReading), true);
assert.strictEqual(isValidSignReading({ ...goodReading, luckyNumber: "7" }), false, "luckyNumber must be a number");
assert.strictEqual(isValidSignReading({ ...goodReading, overview: "" }), false, "empty string field must fail");
assert.strictEqual(isValidSignReading({ ...goodReading, love: undefined }), false, "missing required field must fail");
assert.strictEqual(isValidSignReading(null), false);
assert.strictEqual(isValidSignReading("not an object"), false);
assert.strictEqual(
  isValidSignReading({ ...goodReading, mood: "Bright", compatibility: "Pairs well with Leo" }),
  true,
  "optional fields, when present as strings, must pass"
);
assert.strictEqual(isValidSignReading({ ...goodReading, mood: 5 }), false, "optional field with wrong type must fail");

const fullSet: Record<string, unknown> = {};
for (const slug of ZODIAC_ORDER) fullSet[slug] = goodReading;
assert.ok(validateGeneratedSet(fullSet), "a complete, valid 12-sign set must validate");
assert.strictEqual(Object.keys(validateGeneratedSet(fullSet)!).length, 12);

const missingOne: Record<string, unknown> = { ...fullSet };
delete missingOne[ZODIAC_ORDER[0]];
assert.strictEqual(validateGeneratedSet(missingOne), null, "a set missing one sign must fail");

const oneBad: Record<string, unknown> = { ...fullSet, [ZODIAC_ORDER[1]]: { bad: true } };
assert.strictEqual(validateGeneratedSet(oneBad), null, "a set with one malformed sign must fail");

assert.strictEqual(validateGeneratedSet(null), null);
assert.strictEqual(validateGeneratedSet("nope"), null);

console.log("validate.test.ts: all assertions passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/lib/horoscope/validate.test.ts`
Expected: FAIL — `Cannot find module '.../validate.ts'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/horoscope/validate.ts
// Guards the one place untrusted data enters this system: the LLM's
// response. Nothing downstream (Firestore write, page render) should
// ever see a shape it doesn't expect.
import { ZODIAC_ORDER, type ZodiacSlug } from "./zodiac.ts";
import { SIGN_READING_REQUIRED_STRING_KEYS, type SignReading } from "./types.ts";

export function isValidSignReading(value: unknown): value is SignReading {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  for (const key of SIGN_READING_REQUIRED_STRING_KEYS) {
    if (typeof v[key] !== "string" || (v[key] as string).trim() === "") {
      return false;
    }
  }

  if (typeof v.luckyNumber !== "number" || !Number.isFinite(v.luckyNumber)) {
    return false;
  }

  if (v.mood !== undefined && typeof v.mood !== "string") return false;
  if (v.compatibility !== undefined && typeof v.compatibility !== "string") {
    return false;
  }

  return true;
}

export function validateGeneratedSet(
  raw: unknown
): Record<ZodiacSlug, SignReading> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const result = {} as Record<ZodiacSlug, SignReading>;

  for (const slug of ZODIAC_ORDER) {
    const entry = r[slug];
    if (!isValidSignReading(entry)) return null;
    result[slug] = entry;
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/lib/horoscope/validate.test.ts`
Expected: prints `validate.test.ts: all assertions passed`, exit code 0.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/horoscope/validate.ts src/lib/horoscope/validate.test.ts
git commit -m "feat(horoscope): add LLM output validation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 5: `src/lib/horoscope/date.ts` — IST calendar date

**Files:**
- Create: `src/lib/horoscope/date.ts`
- Test: `src/lib/horoscope/date.test.ts`

**Interfaces:**
- Produces: `getTodayIST(now?: Date): string` — returns `"YYYY-MM-DD"` for the given instant in `Asia/Kolkata`. Relied on by Tasks 8, 9, 14, 15.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/horoscope/date.test.ts
import assert from "node:assert/strict";
import { getTodayIST } from "./date.ts";

// IST = UTC+5:30, so IST midnight on 2026-09-01 is 2026-08-31T18:30:00Z.
assert.strictEqual(
  getTodayIST(new Date("2026-08-31T18:29:00.000Z")),
  "2026-08-31",
  "one minute before IST midnight is still the previous IST day"
);
assert.strictEqual(
  getTodayIST(new Date("2026-08-31T18:30:00.000Z")),
  "2026-09-01",
  "exactly at IST midnight rolls to the next IST day"
);
assert.strictEqual(
  getTodayIST(new Date("2026-08-31T12:00:00.000Z")),
  "2026-08-31",
  "midday UTC is mid-evening IST, same calendar day"
);
assert.strictEqual(getTodayIST(new Date("2026-01-01T00:00:00.000Z")), "2026-01-01");

console.log("date.test.ts: all assertions passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/lib/horoscope/date.test.ts`
Expected: FAIL — `Cannot find module '.../date.ts'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/horoscope/date.ts
// The single source of truth for "what day is it" across this system —
// the cron route, the read-through store, and every page that displays
// "today's" reading all call this instead of `new Date()` directly, so
// the IST rollover rule lives in exactly one place.

/** Today's date in Asia/Kolkata, as "YYYY-MM-DD". Accepts an explicit
 * instant for testability; defaults to the real current time. */
export function getTodayIST(now: Date = new Date()): string {
  // en-CA's date formatting is YYYY-MM-DD, which is also exactly the
  // Firestore doc-id / ISO calendar-date format we want — no manual
  // string assembly needed.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/lib/horoscope/date.test.ts`
Expected: prints `date.test.ts: all assertions passed`, exit code 0.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/horoscope/date.ts src/lib/horoscope/date.test.ts
git commit -m "feat(horoscope): add IST calendar-date helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 6: `src/lib/firebase-admin.ts` — Firestore singleton

**Files:**
- Create: `src/lib/firebase-admin.ts`
- Modify: `package.json` (move `firebase-admin` to `dependencies`)
- Create: `scripts/dev/verify-firebase-admin.ts`

**Interfaces:**
- Produces: `getFirestoreDb(): Firestore` (from `firebase-admin/firestore`). Relied on by Task 8.

This talks to real Firestore — no framework to mock it with in this repo, so verification is a manual dry-run against the real project (matches spec §13), not an automated test.

- [ ] **Step 1: Move `firebase-admin` to `dependencies`**

In `package.json`, remove the `"firebase-admin": "^14.3.0",` line from `devDependencies` and add it to `dependencies` instead (create the `dependencies` block if `package.json` doesn't already have one — it currently only has `lucide-react`, `next`, `react`, `react-dom` there, so add `firebase-admin` alongside those, alphabetically).

- [ ] **Step 2: Reinstall to confirm the manifest is consistent**

Run: `npm install`
Expected: exits 0, `package-lock.json` updates cleanly (no version change, just the dependency-type move).

- [ ] **Step 3: Write `src/lib/firebase-admin.ts`**

```ts
// src/lib/firebase-admin.ts
// Server-only Firestore access (Admin SDK) — never import this from a
// "use client" file. Reads FIREBASE_ADMIN_* env vars, which must never
// reach the browser bundle. There's no "server-only" package in this
// repo to enforce that mechanically — it's enforced purely by
// convention: only import this from Route Handlers / Server Components.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY"
    );
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // The env var stores the PEM key with literal "\n" sequences
      // (a multi-line PEM can't survive a single-line .env value
      // otherwise) — turn them back into real newlines.
      privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getAdminApp());
}
```

- [ ] **Step 4: Write the dry-run verification script**

```ts
// scripts/dev/verify-firebase-admin.ts
// Manual connectivity check — proves the FIREBASE_ADMIN_* credentials
// in .env.local actually authenticate against the real project. Not
// an automated test (there's no way to fake Firestore in this repo);
// re-run this any time Firestore access seems broken.
//
// Usage: node --env-file=.env.local scripts/dev/verify-firebase-admin.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKeyRaw) {
  throw new Error("Missing FIREBASE_ADMIN_* env vars — run with --env-file=.env.local");
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    }),
  });

const db = getFirestore(app);
const ref = db.collection("_connectivityProbe").doc("verify-firebase-admin");

await ref.set({ checkedAt: new Date().toISOString() });
const snap = await ref.get();
console.log("write+read ok:", snap.data());
await ref.delete();
console.log("cleanup ok — Firestore connectivity confirmed");
```

- [ ] **Step 5: Run the dry-run**

Run: `node --env-file=.env.local scripts/dev/verify-firebase-admin.ts`
Expected: prints `write+read ok: { checkedAt: '...' }` then `cleanup ok — Firestore connectivity confirmed`, exit code 0. If it throws a credential or permission error, stop and check the `FIREBASE_ADMIN_*` values in `.env.local` before continuing to later tasks — everything from Task 8 onward depends on this working.

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors. (`scripts/dev/` isn't under `src/`, so it isn't linted by `eslint src` — that's fine, it matches how `scripts/upload-images-to-firebase.mjs` is already handled in this repo.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/firebase-admin.ts scripts/dev/verify-firebase-admin.ts package.json package-lock.json
git commit -m "feat: add Firestore Admin SDK singleton

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 7: `src/lib/horoscope/openrouter.ts` — prompt + generation call

**Files:**
- Create: `src/lib/horoscope/openrouter.ts`
- Test: `src/lib/horoscope/openrouter.test.ts` (pure prompt builder only)
- Create: `scripts/dev/verify-openrouter.ts` (manual dry-run, real API call)

**Interfaces:**
- Consumes: `ZODIAC_ORDER`, `ZODIAC_META`, `ZodiacSlug` from `./zodiac.ts`; `validateGeneratedSet` from `./validate.ts`; `SignReading` from `./types.ts`.
- Produces: `buildHoroscopePrompt(date: string): string` (pure), `generateAllSignReadings(date: string): Promise<Record<ZodiacSlug, SignReading>>` (network). Relied on by Task 8.

- [ ] **Step 1: Write the failing test (pure prompt builder only)**

```ts
// src/lib/horoscope/openrouter.test.ts
import assert from "node:assert/strict";
import { buildHoroscopePrompt } from "./openrouter.ts";
import { ZODIAC_ORDER, ZODIAC_META } from "./zodiac.ts";

const prompt = buildHoroscopePrompt("2026-09-01");

assert.ok(prompt.includes("2026-09-01"), "prompt must include the target date");
assert.ok(/JSON/.test(prompt), "prompt must instruct JSON-only output");

for (const slug of ZODIAC_ORDER) {
  assert.ok(
    prompt.includes(ZODIAC_META[slug].name),
    `prompt must mention ${ZODIAC_META[slug].name}`
  );
}

console.log("openrouter.test.ts: all assertions passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/lib/horoscope/openrouter.test.ts`
Expected: FAIL — `Cannot find module '.../openrouter.ts'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/horoscope/openrouter.ts
// Server-only — never import from a "use client" file (reads
// OPENROUTER_API_KEY_PAID).
import { ZODIAC_ORDER, ZODIAC_META, type ZodiacSlug } from "./zodiac.ts";
import { validateGeneratedSet } from "./validate.ts";
import type { SignReading } from "./types.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Pure — builds the full generation prompt for a given IST date.
 * Requests all 12 signs in one call: cheaper than 12 separate calls,
 * and letting the model see all 12 at once is what keeps it from
 * repeating the same phrasing across signs. */
export function buildHoroscopePrompt(date: string): string {
  const signLines = ZODIAC_ORDER.map((slug) => {
    const m = ZODIAC_META[slug];
    return `- ${m.name} (${slug}): ${m.dateRange}, ${m.element} sign`;
  }).join("\n");

  return `You are a professional astrologer writing today's (${date}) daily horoscope for a premium astrology website. Write a complete, distinct reading for EACH of the following 12 zodiac signs:
${signLines}

For each sign, write:
- overview: 2-3 sentences, the day's general reading
- love: 1-2 sentences
- career: 1-2 sentences
- finance: 1-2 sentences
- health: 1-2 sentences
- luckyNumber: a whole number from 1 to 99
- luckyColor: one color name
- theme: a short one-line theme for the day (max 8 words)

Tone: warm, inspirational, spiritual, premium — never robotic. Each sign's reading must read as genuinely distinct from every other sign's — do not reuse the same sentence structure or phrasing across signs.

Do not include: fear-based predictions, absolute guarantees, medical diagnoses, extreme financial claims, or guaranteed life outcomes.

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape (one entry per sign slug, using these exact slugs: ${ZODIAC_ORDER.join(", ")}):
{
  "aries": { "overview": "...", "love": "...", "career": "...", "finance": "...", "health": "...", "luckyNumber": 0, "luckyColor": "...", "theme": "..." },
  "taurus": { "...": "..." }
}`;
}

async function callOpenRouter(prompt: string): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY_PAID;
  const model = process.env.OPENROUTER_MODEL_FREE;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY_PAID is not set");
  if (!model) throw new Error("OPENROUTER_MODEL_FREE is not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter response had no message content");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("OpenRouter response was not valid JSON");
  }
}

/** Generates and validates all 12 signs' readings for `date`. Retries
 * once with a stricter prompt if the first response doesn't validate —
 * malformed JSON or a missing sign is the only failure worth a second
 * try; if it fails twice in a row the model/prompt needs a human look,
 * not a retry loop. */
export async function generateAllSignReadings(
  date: string
): Promise<Record<ZodiacSlug, SignReading>> {
  const prompt = buildHoroscopePrompt(date);

  const first = await callOpenRouter(prompt);
  const validated = validateGeneratedSet(first);
  if (validated) return validated;

  const retryPrompt = `${prompt}\n\nIMPORTANT: your previous response did not match the required JSON shape exactly. Respond with ONLY the raw JSON object described above — all 12 signs, all required fields present and non-empty, luckyNumber as a number not a string.`;
  const second = await callOpenRouter(retryPrompt);
  const validatedRetry = validateGeneratedSet(second);
  if (validatedRetry) return validatedRetry;

  throw new Error("OpenRouter returned an invalid horoscope set after one retry");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/lib/horoscope/openrouter.test.ts`
Expected: prints `openrouter.test.ts: all assertions passed`, exit code 0.

- [ ] **Step 5: Write the manual dry-run script (real OpenRouter call)**

```ts
// scripts/dev/verify-openrouter.ts
// Manual check — makes one real OpenRouter call and prints the
// validated result. Not an automated test (no mocking framework in
// this repo, and the whole point is confirming the real API contract).
//
// Usage: node --env-file=.env.local scripts/dev/verify-openrouter.ts
import { generateAllSignReadings } from "../../src/lib/horoscope/openrouter.ts";
import { getTodayIST } from "../../src/lib/horoscope/date.ts";

const date = getTodayIST();
console.log(`Requesting horoscope set for ${date}...`);

const signs = await generateAllSignReadings(date);
console.log(`Received ${Object.keys(signs).length} validated signs.`);
console.log(JSON.stringify(signs.aries, null, 2));
```

- [ ] **Step 6: Run the dry-run**

Run: `node --env-file=.env.local scripts/dev/verify-openrouter.ts`
Expected: prints "Received 12 validated signs." and a readable Aries reading. Read through 2-3 signs' worth of output to confirm the tone matches spec §8 (no fear-based/absolute-guarantee language) and that phrasing isn't near-identical across signs. If validation fails, the retry message from Step 3's implementation will show in the thrown error — inspect it before assuming a bug in `validate.ts`.

- [ ] **Step 7: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/horoscope/openrouter.ts src/lib/horoscope/openrouter.test.ts scripts/dev/verify-openrouter.ts
git commit -m "feat(horoscope): add OpenRouter prompt and generation call

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 8: `src/lib/horoscope/store.ts` — Firestore read-through store

**Files:**
- Create: `src/lib/horoscope/store.ts`
- Create: `scripts/dev/verify-horoscope-store.ts` (manual dry-run)

**Interfaces:**
- Consumes: `getFirestoreDb` from `../firebase-admin.ts` (relative, not the `@/` alias — see Global Constraints); `generateAllSignReadings` from `./openrouter.ts`; `DailyHoroscopeDoc` from `./types.ts`.
- Produces: `getDailyHoroscopes(date: string): Promise<DailyHoroscopeDoc | null>`, `generateDailyHoroscopes(date: string): Promise<DailyHoroscopeDoc>`, `getOrGenerateDailyHoroscopes(date: string): Promise<DailyHoroscopeDoc>`. Relied on by Tasks 9, 14, 15.

This is the piece that ties Firestore + OpenRouter together — no automated test (both are real external services), verified with a dry-run against the real project.

- [ ] **Step 1: Write the implementation**

```ts
// src/lib/horoscope/store.ts
// Server-only. The single choke point every page and the cron route
// goes through for "today's readings" — generates at most once per
// IST date and serves every subsequent caller the stored result.
//
// Imports its firebase-admin sibling by relative path (not the "@/"
// alias) so this file — and scripts/dev/verify-horoscope-store.ts,
// which imports it directly — can also run under plain `node`, not
// just inside Next's bundler.
import { getFirestoreDb } from "../firebase-admin.ts";
import { generateAllSignReadings } from "./openrouter.ts";
import type { DailyHoroscopeDoc } from "./types.ts";

const COLLECTION = "dailyHoroscopes";

export async function getDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc | null> {
  const snap = await getFirestoreDb().collection(COLLECTION).doc(date).get();
  if (!snap.exists) return null;
  return snap.data() as DailyHoroscopeDoc;
}

export async function generateDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc> {
  const signs = await generateAllSignReadings(date);
  const doc: DailyHoroscopeDoc = {
    date,
    generatedAt: new Date().toISOString(),
    model: process.env.OPENROUTER_MODEL_FREE ?? "unknown",
    signs,
  };

  const ref = getFirestoreDb().collection(COLLECTION).doc(date);
  try {
    // create() (not set()) fails if the doc already exists — the
    // signal that a concurrent caller (cron + a visitor hitting the
    // same missing date, or two visitors at once) won the race.
    await ref.create(doc);
    return doc;
  } catch {
    const existing = await getDailyHoroscopes(date);
    if (existing) return existing;
    throw new Error(`Failed to create or read daily horoscope doc for ${date}`);
  }
}

export async function getOrGenerateDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc> {
  const existing = await getDailyHoroscopes(date);
  if (existing) return existing;
  return generateDailyHoroscopes(date);
}
```

- [ ] **Step 2: Write the dry-run verification script**

```ts
// scripts/dev/verify-horoscope-store.ts
// Manual check — exercises the full read-through path against real
// Firestore + OpenRouter. Run it twice: the first run should generate
// (and print a fresh generatedAt), the second should hit the cache
// (same generatedAt, no new OpenRouter call, near-instant).
//
// Usage: node --env-file=.env.local scripts/dev/verify-horoscope-store.ts
import { getOrGenerateDailyHoroscopes } from "../../src/lib/horoscope/store.ts";
import { getTodayIST } from "../../src/lib/horoscope/date.ts";

const date = getTodayIST();
const start = Date.now();
const doc = await getOrGenerateDailyHoroscopes(date);
const elapsedMs = Date.now() - start;

console.log(`date=${doc.date} generatedAt=${doc.generatedAt} model=${doc.model}`);
console.log(`signs stored: ${Object.keys(doc.signs).length}`);
console.log(`elapsed: ${elapsedMs}ms`);
```

- [ ] **Step 3: Run the dry-run twice**

Run: `node --env-file=.env.local scripts/dev/verify-horoscope-store.ts`
Expected (first run): "signs stored: 12", elapsed is several seconds (real generation).

Run it again: `node --env-file=.env.local scripts/dev/verify-horoscope-store.ts`
Expected (second run): identical `generatedAt` to the first run, elapsed drops to well under a second (Firestore read only, no generation) — confirms the once-per-day behavior from spec §16.

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/horoscope/store.ts scripts/dev/verify-horoscope-store.ts
git commit -m "feat(horoscope): add Firestore read-through store

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 9: Cron route + `vercel.json`

**Files:**
- Create: `src/app/api/cron/generate-horoscopes/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `getOrGenerateDailyHoroscopes` from `@/lib/horoscope/store`; `getTodayIST` from `@/lib/horoscope/date`.

- [ ] **Step 1: Write the route**

```ts
// src/app/api/cron/generate-horoscopes/route.ts
import { NextResponse } from "next/server";
import { getTodayIST } from "@/lib/horoscope/date";
import { getOrGenerateDailyHoroscopes } from "@/lib/horoscope/store";

// Never statically evaluate this route — it must run fresh on every
// invocation (both the daily cron trigger and any manual check).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const date = getTodayIST();
    const doc = await getOrGenerateDailyHoroscopes(date);
    return NextResponse.json({
      date: doc.date,
      generatedAt: doc.generatedAt,
      signCount: Object.keys(doc.signs).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Write `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/generate-horoscopes", "schedule": "35 18 * * *" }
  ]
}
```

- [ ] **Step 3: Verify locally — unauthorized request rejected**

Run (in one terminal): `npm run dev`
Run (in another): `curl -i http://localhost:3000/api/cron/generate-horoscopes`
Expected: `HTTP/1.1 401` and `{"error":"Unauthorized"}`.

- [ ] **Step 4: Verify locally — authorized request generates/serves**

Run (reading the real secret out of `.env.local` without printing it):
```bash
curl -i http://localhost:3000/api/cron/generate-horoscopes \
  -H "Authorization: Bearer $(node -e "console.log(require('dotenv-less-read'))" 2>/dev/null || grep '^CRON_SECRET=' .env.local | cut -d= -f2-)"
```
Simpler: open `.env.local`, copy the `CRON_SECRET` value manually, then run:
```bash
curl -i http://localhost:3000/api/cron/generate-horoscopes -H "Authorization: Bearer <paste-CRON_SECRET-here>"
```
Expected: `HTTP/1.1 200` and `{"date":"...","generatedAt":"...","signCount":12}`. Since Task 8's dry-run already generated today's doc, this should return instantly (cache hit) with the same `generatedAt`.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/generate-horoscopes/route.ts vercel.json
git commit -m "feat(horoscope): add daily generation cron route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 10: Homepage placement — extract curve, insert `HoroscopeSection` placeholder

**Files:**
- Create: `src/components/hero/HeroToServicesCurve.tsx`
- Modify: `src/components/quick-services/QuickServices.tsx`
- Create: `src/components/horoscope/HoroscopeSection.tsx` (heading only — no cards yet, those come in Tasks 12/13)
- Modify: `src/app/page.tsx`

This is the structural change from spec §2 — doing it now, before the card grid/carousel exist, means the trickiest part (the seam/placement) gets its own isolated visual check.

- [ ] **Step 1: Extract `HeroToServicesCurve`**

Read `src/components/quick-services/QuickServices.tsx` and find the `HeroToServicesCurve` function (it's a private function near the bottom of the file, right after `SectionDivider`). Copy it verbatim into a new file:

```tsx
// src/components/hero/HeroToServicesCurve.tsx
import { LotusIcon } from "@/components/quick-services/icons";

/** The curved lower hero boundary + the lotus ornament resting below it. A
 * single wide, smooth two-cubic dome — spanning the full width in two
 * symmetric halves rather than a narrow S-curve confined to the centre —
 * so it stays a gentle half-circle silhouette at any aspect ratio instead
 * of turning into a sharp point when squeezed into a narrow mobile width.
 * Pure SVG/CSS (no raster image), so it stays crisp and resizes with the
 * viewport instead of being baked into a fixed asset.
 *
 * Sits directly under HeroCarousel, before HoroscopeSection — see
 * page.tsx for why this moved out of QuickServices. */
export function HeroToServicesCurve() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-20 h-[clamp(1.75rem,4vw,3rem)] w-full"
    >
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full fill-nav-ivory"
      >
        <path d="M0,188 C288,188 468,20 720,20 C972,20 1152,188 1440,188 L1440,200 L0,200 Z" />
      </svg>

      <LotusIcon
        className="absolute left-1/2 text-nav-violet drop-shadow-[0_1px_2px_rgba(70,40,120,0.25)]"
        strokeWidth={1.5}
        style={{
          top: "78%",
          width: "clamp(1.5rem, 3.6vw, 2.25rem)",
          height: "clamp(1.5rem, 3.6vw, 2.25rem)",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Remove it from `QuickServices.tsx`**

In `src/components/quick-services/QuickServices.tsx`:
- Delete the `<HeroToServicesCurve />` call (and its preceding comment) from the top of the returned JSX.
- Delete the entire `function HeroToServicesCurve() { ... }` definition and its doc comment near the bottom of the file.
- Update the comment above the `<div className="relative pb-12 md:pb-24">` — it currently says "No background here — the page-level wrapper (see page.tsx) now paints one continuous wash behind this, ExploreServices and PersonalizedReportsBanner together." That's still accurate (unchanged), leave it as-is.
- Leave everything else in the file untouched.

- [ ] **Step 3: Write the placeholder `HoroscopeSection`**

```tsx
// src/components/horoscope/HoroscopeSection.tsx
import { LotusIcon } from "@/components/quick-services/icons";

/** Homepage zodiac section — sits directly under HeroToServicesCurve,
 * taking over the "tuck under the dome" negative-margin that used to
 * belong to the wash div wrapping QuickServices (see page.tsx). Static:
 * cards show symbol/name/date-range only, no daily content, so this
 * section needs no data fetch — see spec §3.
 *
 * Cards (ZodiacGrid for desktop, ZodiacCarousel for mobile) land here
 * in Tasks 12-13; this task only establishes the placement/background
 * seam with the heading alone. */
export function HoroscopeSection() {
  return (
    <section
      aria-labelledby="horoscope-heading"
      className="relative -mt-[clamp(1.75rem,4vw,3rem)] bg-nav-ivory pb-12 pt-10 md:pb-20 md:pt-14"
    >
      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="horoscope-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Daily <span className="text-nav-amethyst">Horoscope</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Your stars, refreshed every day.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Rewire `page.tsx`**

In `src/app/page.tsx`, add imports:
```tsx
import { HeroToServicesCurve } from "@/components/hero/HeroToServicesCurve";
import { HoroscopeSection } from "@/components/horoscope/HoroscopeSection";
```

Change:
```tsx
<HeroCarousel />

{/* QuickServices, ExploreServices, PersonalizedReportsBanner and
    HealingSection share ONE continuous background wash ... */}
<div className="relative z-10 -mt-[clamp(1.75rem,4vw,3rem)]">
```
to:
```tsx
<HeroCarousel />
<HeroToServicesCurve />
<HoroscopeSection />

{/* QuickServices, ExploreServices, PersonalizedReportsBanner and
    HealingSection share ONE continuous background wash ... HoroscopeSection
    now owns the tuck-under-the-dome negative margin that used to live
    here, so this wrapper just needs the same plain -mt-px seam every
    other section boundary on this page uses. */}
<div className="relative z-10 -mt-px">
```
(Everything else inside that div — the gradient background layer and the four sections it wraps — is unchanged.)

- [ ] **Step 5: Browser check**

Run `npm run dev`, open `http://localhost:3000`, and check:
- The ivory dome + lotus ornament still sits directly under the hero carousel, unchanged.
- "Daily Horoscope — Your stars, refreshed every day." appears directly below that, with no visible seam/gap/color-mismatch between the dome and this new section.
- Scroll further down — QuickServices' heading ("Explore Astrology, Instantly.") now appears right after the Horoscope heading with a clean ivory-to-wash handoff, and QuickServices itself looks exactly as it did before (same cards, same layout — only its curve moved away).
- Check both a mobile width (375px) and desktop width (1440px) for the same seam.

- [ ] **Step 6: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors, no unused-import warnings in `QuickServices.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/hero/HeroToServicesCurve.tsx src/components/quick-services/QuickServices.tsx src/components/horoscope/HoroscopeSection.tsx src/app/page.tsx
git commit -m "feat(horoscope): place Horoscope section under the hero curve

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 11: Zodiac icons + UI data

**Files:**
- Create: `src/components/horoscope/icons.tsx`
- Create: `src/components/horoscope/zodiac-ui-data.ts`

**Interfaces:**
- Consumes: `ZODIAC_ORDER`, `ZODIAC_META`, `ZodiacSlug` from `@/lib/horoscope/zodiac`.
- Produces: 12 icon components; `ZodiacCardData` (type), `ZODIAC_CARDS: ZodiacCardData[]`. Relied on by Tasks 12, 13, 14.

These render the traditional astrological glyph for each sign (ram-horn curls for Aries, the horned circle for Taurus, etc.) as clean line-art in the site's existing stroke language — not pictorial animal illustrations (hard to get looking consistent without a real asset) and not raw Unicode characters (the spec explicitly rules those out as the primary visual). Visual verification happens in Task 12 once they're rendered inside a real card; this task is `tsc`/`eslint` only.

- [ ] **Step 1: Write the icons**

```tsx
// src/components/horoscope/icons.tsx
// Line-art zodiac glyphs — same stroke language as LotusIcon and
// src/components/quick-services/icons.tsx (viewBox 24, currentColor,
// round caps/joins). Each renders the traditional astrological symbol
// for its sign as real vector line-art, not a Unicode character —
// keeps all 12 visually consistent as one family at any size.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Aries — the ram's curled horns. */
export function RamIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,6 C6,10 8,12 8,16 M8,16 C8,12 10,10 12,10 C14,10 16,12 16,16 M16,16 C16,12 18,10 18,6" />
    </svg>
  );
}

/** Taurus — the bull: a circle with upward horns. */
export function BullIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="15" r="5" />
      <path d="M7,10 C7,6 9,4 9,4 M17,10 C17,6 15,4 15,4" />
    </svg>
  );
}

/** Gemini — the twins: two pillars joined by top and bottom bars. */
export function TwinsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,5 H18 M6,19 H18 M9,5 C7,9 7,15 9,19 M15,5 C17,9 17,15 15,19" />
    </svg>
  );
}

/** Cancer — the crab: two circles joined by interlocking curved arms. */
export function CrabIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="16" r="2.2" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M8,13.5 C8,9 12,9 12,12 C12,15 16,15 16,10.5" />
    </svg>
  );
}

/** Leo — the lion: a loop with a long trailing tail. */
export function LionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8,11 C8,16 14,14 14,18 C14,20 16,20.5 17,19" />
    </svg>
  );
}

/** Virgo — the maiden: a script "M" ending in a looped, crossed tail. */
export function MaidenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5,6 V16 M5,6 C5,10 8,10 8,6 M8,6 V16 M8,6 C8,10 11,10 11,6 M11,6 V15 C11,17.5 13,18.5 15,17 C16.5,15.8 15,14.3 13.5,15.3 C12.2,16.1 13,18 14.7,17.8" />
    </svg>
  );
}

/** Libra — the scales: a balance beam over a base. */
export function ScalesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,10 C6,7 9,6 12,6 C15,6 18,7 18,10" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/** Scorpio — like the maiden's "M", but ending in a barbed stinger tail. */
export function ScorpionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5,6 V16 M5,6 C5,10 8,10 8,6 M8,6 V16 M8,6 C8,10 11,10 11,6 M11,6 V15 L15,15 L15,11 M15,15 L18,12 M15,15 L18,18" />
    </svg>
  );
}

/** Sagittarius — the archer's arrow, fletched, crossing a line. */
export function ArcherIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,18 L18,6 M13,6 H18 V11 M8,13 L11,16" />
    </svg>
  );
}

/** Capricorn — the sea-goat: a horn curling into a fish-tail swirl. */
export function SeaGoatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,6 C6,10 6,14 9,14 C11,14 11,11 9,11 M9,14 C9,17 12,19 15,17 C17,15.5 16,13 14,14 C12.5,14.7 13,17 15,17" />
    </svg>
  );
}

/** Aquarius — the water bearer: two parallel wavy lines. */
export function WaterBearerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4,10 L8,7 L12,10 L16,7 L20,10 M4,16 L8,13 L12,16 L16,13 L20,16" />
    </svg>
  );
}

/** Pisces — two fish arcing away from each other, joined by a line. */
export function FishIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8,5 C4,9 4,15 8,19 M16,5 C20,9 20,15 16,19 M5,12 H19" />
    </svg>
  );
}
```

- [ ] **Step 2: Write the UI data**

```ts
// src/components/horoscope/zodiac-ui-data.ts
import type { ComponentType, SVGProps } from "react";
import { ZODIAC_ORDER, ZODIAC_META, type ZodiacSlug } from "@/lib/horoscope/zodiac";
import {
  RamIcon, BullIcon, TwinsIcon, CrabIcon, LionIcon, MaidenIcon,
  ScalesIcon, ScorpionIcon, ArcherIcon, SeaGoatIcon, WaterBearerIcon, FishIcon,
} from "./icons";

export type ZodiacCardData = {
  slug: ZodiacSlug;
  name: string;
  dateRange: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const ICON_BY_SLUG: Record<ZodiacSlug, ComponentType<SVGProps<SVGSVGElement>>> = {
  aries: RamIcon,
  taurus: BullIcon,
  gemini: TwinsIcon,
  cancer: CrabIcon,
  leo: LionIcon,
  virgo: MaidenIcon,
  libra: ScalesIcon,
  scorpio: ScorpionIcon,
  sagittarius: ArcherIcon,
  capricorn: SeaGoatIcon,
  aquarius: WaterBearerIcon,
  pisces: FishIcon,
};

export const ZODIAC_CARDS: ZodiacCardData[] = ZODIAC_ORDER.map((slug) => ({
  slug,
  name: ZODIAC_META[slug].name,
  dateRange: ZODIAC_META[slug].dateRange,
  Icon: ICON_BY_SLUG[slug],
}));
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/horoscope/icons.tsx src/components/horoscope/zodiac-ui-data.ts
git commit -m "feat(horoscope): add zodiac line-art icons and UI data

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 12: `ZodiacCard` + `ZodiacGrid` (desktop 6×2)

**Files:**
- Create: `src/components/horoscope/ZodiacCard.tsx`
- Create: `src/components/horoscope/ZodiacGrid.tsx`
- Modify: `src/components/horoscope/HoroscopeSection.tsx`

**Interfaces:**
- Consumes: `ZodiacCardData`, `ZODIAC_CARDS` from `./zodiac-ui-data.ts`.
- Produces: `ZodiacCard(props: ZodiacCardData)`, `ZodiacGrid()`. Relied on by Tasks 13, 15.

- [ ] **Step 1: Write `ZodiacCard.tsx`**

```tsx
// src/components/horoscope/ZodiacCard.tsx
import Link from "next/link";
import type { ZodiacCardData } from "./zodiac-ui-data";

/** One zodiac sign, linking to its reading page. Sized entirely via
 * cqw/clamp() so it scales cleanly whether it's one of six in the
 * desktop grid or one of four visible in the mobile carousel — same
 * container-query approach as ProductCard. Equal width/height comes
 * from the parent grid/flex, not a fixed size here. */
export function ZodiacCard({ slug, name, dateRange, Icon }: ZodiacCardData) {
  return (
    <Link
      href={`/horoscope/${slug}`}
      aria-label={`${name} daily horoscope, ${dateRange}`}
      className="group flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist px-2 py-4 text-center shadow-[0_6px_18px_-12px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-nav-amethyst/50 hover:shadow-[0_14px_28px_-14px_rgba(70,40,120,0.4)]"
    >
      <Icon
        className="h-[clamp(1.6rem,6cqw,2.5rem)] w-[clamp(1.6rem,6cqw,2.5rem)] text-nav-amethyst-deep transition-colors duration-300 group-hover:text-nav-amethyst"
        strokeWidth={1.4}
      />
      <span className="font-serif text-[clamp(0.75rem,3.4cqw,0.95rem)] leading-tight text-nav-violet">
        {name}
      </span>
      <span className="text-[clamp(0.6rem,2.6cqw,0.7rem)] text-nav-plum/60">
        {dateRange}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Write `ZodiacGrid.tsx`**

```tsx
// src/components/horoscope/ZodiacGrid.tsx
import { ZODIAC_CARDS } from "./zodiac-ui-data";
import { ZodiacCard } from "./ZodiacCard";

/** Desktop/tablet — all 12 signs, 6 columns × 2 rows, nothing hidden,
 * no horizontal scroll. Below md, ZodiacCarousel (see that file) takes
 * over instead. */
export function ZodiacGrid() {
  return (
    <ul className="hidden gap-4 md:grid md:grid-cols-6 md:grid-rows-2">
      {ZODIAC_CARDS.map((card) => (
        <li key={card.slug} className="[container-type:inline-size]">
          <ZodiacCard {...card} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Wire `ZodiacGrid` into `HoroscopeSection`**

In `src/components/horoscope/HoroscopeSection.tsx`, add the import `import { ZodiacGrid } from "./ZodiacGrid";` and, right after the closing `</div>` of the heading block (before the section's closing `</div>`), add:
```tsx
<div className="mt-10 md:mt-14">
  <ZodiacGrid />
</div>
```

- [ ] **Step 4: Browser check — desktop**

Run `npm run dev`, open `http://localhost:3000` at a desktop width (≥1280px). Confirm:
- All 12 cards visible in a 6×2 grid (Aries–Virgo top row, Libra–Pisces bottom row).
- Equal card width/height, consistent icon size and text alignment across all 12.
- Each icon is visually distinct and reads clearly at this size — if any glyph looks ambiguous or malformed, adjust its path data in `icons.tsx` now before moving on.
- Hovering a card lifts it slightly and darkens the icon/border (the `group-hover` styles).
- Clicking a card navigates to `/horoscope/<slug>` (expect a 404 for now — the route doesn't exist until Task 14 — that's fine, confirms the link itself is correct).

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/horoscope/ZodiacCard.tsx src/components/horoscope/ZodiacGrid.tsx src/components/horoscope/HoroscopeSection.tsx
git commit -m "feat(horoscope): add zodiac card and desktop 6x2 grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 13: `ZodiacCarousel` (mobile, native scroll-snap)

**Files:**
- Create: `src/components/horoscope/ZodiacCarousel.tsx`
- Modify: `src/components/horoscope/HoroscopeSection.tsx`

**Interfaces:**
- Consumes: `ZODIAC_CARDS` from `./zodiac-ui-data.ts`; `ZodiacCard` from `./ZodiacCard.tsx`.
- Produces: `ZodiacCarousel()`. Relied on by Task 15.

- [ ] **Step 1: Write `ZodiacCarousel.tsx`**

```tsx
// src/components/horoscope/ZodiacCarousel.tsx
import { ZODIAC_CARDS } from "./zodiac-ui-data";
import { ZodiacCard } from "./ZodiacCard";

// 4 cards visible per view: card width = (100% - 3 gaps) / 4. Kept as
// a real CSS calc() (not a fixed px value) so it holds correctly from
// 320px through 430px+ instead of being tuned for one phone width.
const GAP_REM = 0.75; // matches gap-3
const CARD_WIDTH = `calc((100% - ${GAP_REM * 3}rem) / 4)`;

/** Mobile-only (< md) horizontal carousel — native CSS scroll-snap, no
 * JS. Deliberately not PujaCarousel's peek-carousel (1 active + 2
 * peeking, JS-driven infinite loop with its own bug history) — this
 * needs a different shape (4 fully visible cards) that scroll-snap
 * handles natively and more robustly. overscroll-x-contain keeps
 * rubber-band scrolling from leaking into the page. */
export function ZodiacCarousel() {
  return (
    <div className="md:hidden">
      <ul
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Zodiac signs — swipe to browse"
      >
        {ZODIAC_CARDS.map((card) => (
          <li
            key={card.slug}
            className="shrink-0 snap-start [container-type:inline-size]"
            style={{ width: CARD_WIDTH }}
          >
            <ZodiacCard {...card} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `HoroscopeSection`**

In `src/components/horoscope/HoroscopeSection.tsx`, add `import { ZodiacCarousel } from "./ZodiacCarousel";` and change:
```tsx
<div className="mt-10 md:mt-14">
  <ZodiacGrid />
</div>
```
to:
```tsx
<div className="mt-10 md:mt-14">
  <ZodiacGrid />
  <ZodiacCarousel />
</div>
```

- [ ] **Step 3: Browser check — mobile widths**

With `npm run dev` running, check the homepage at 320px, 360px, 375px, 390px, 412px, and 430px widths. At each:
- Exactly 4 cards are visible in the viewport at once.
- Swiping/dragging horizontally scrolls smoothly to reveal the next cards; it's possible to reach all 12 signs.
- No clipped icons or unreadably small text.
- The page itself does not develop a horizontal scrollbar (only the carousel strip scrolls) — check by trying to scroll the page body horizontally outside the carousel area.
- If the browser's automated `resize_window` tool doesn't reliably hit these exact widths in this environment, use the browser's device toolbar / manual window resize instead, or fall back to a local `sharp`-scaled render of a screenshot the way earlier sections in this codebase were verified.

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/horoscope/ZodiacCarousel.tsx src/components/horoscope/HoroscopeSection.tsx
git commit -m "feat(horoscope): add mobile zodiac carousel (native scroll-snap)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 14: `/horoscope/[sign]` reading page

**Files:**
- Create: `src/components/horoscope/HoroscopeReading.tsx`
- Create: `src/app/horoscope/[sign]/page.tsx`

**Interfaces:**
- Consumes: `ZODIAC_ORDER`, `ZODIAC_META`, `isZodiacSlug` from `@/lib/horoscope/zodiac`; `getOrGenerateDailyHoroscopes` from `@/lib/horoscope/store`; `getTodayIST` from `@/lib/horoscope/date`; `ZODIAC_CARDS` from `@/components/horoscope/zodiac-ui-data`; `SignReading` from `@/lib/horoscope/types`.

- [ ] **Step 1: Write `HoroscopeReading.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `src/app/horoscope/[sign]/page.tsx`**

Next 16's dynamic-route `params` is a `Promise` (confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` in this repo — must `await params`).

```tsx
// src/app/horoscope/[sign]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ZODIAC_ORDER, ZODIAC_META, isZodiacSlug } from "@/lib/horoscope/zodiac";
import { getOrGenerateDailyHoroscopes } from "@/lib/horoscope/store";
import { getTodayIST } from "@/lib/horoscope/date";
import { ZODIAC_CARDS } from "@/components/horoscope/zodiac-ui-data";
import { HoroscopeReading } from "@/components/horoscope/HoroscopeReading";

export const revalidate = 3600;

export function generateStaticParams() {
  return ZODIAC_ORDER.map((sign) => ({ sign }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string }>;
}): Promise<Metadata> {
  const { sign } = await params;
  if (!isZodiacSlug(sign)) return {};
  const meta = ZODIAC_META[sign];
  return {
    title: `${meta.name} Daily Horoscope | TRUELOGER`,
    description: `Today's ${meta.name} horoscope — love, career, finance and health, refreshed daily.`,
  };
}

export default async function ZodiacHoroscopePage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign } = await params;
  if (!isZodiacSlug(sign)) notFound();

  const meta = ZODIAC_META[sign];
  const card = ZODIAC_CARDS.find((c) => c.slug === sign)!;
  const date = getTodayIST();

  try {
    const doc = await getOrGenerateDailyHoroscopes(date);
    return (
      <HoroscopeReading
        meta={meta}
        Icon={card.Icon}
        reading={doc.signs[sign]}
        dateLabel={date}
      />
    );
  } catch {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl text-nav-plum">{meta.name}</h1>
        <p className="mt-4 text-nav-plum/70">
          The stars are aligning — today&apos;s reading will be ready shortly.
          Please check back in a few minutes.
        </p>
      </div>
    );
  }
}
```

- [ ] **Step 3: Browser check**

With `npm run dev` running (today's doc should already exist in Firestore from Task 8/9's dry-runs), visit:
- `http://localhost:3000/horoscope/aries` — confirm symbol, name, date range, today's date, overview/theme, the four field cards, lucky number/color all render with real content matching what Task 7's dry-run showed.
- `http://localhost:3000/horoscope/pisces` and one more sign — confirm each shows genuinely different content (not the same reading repeated).
- `http://localhost:3000/horoscope/dragon` — confirm a standard Next.js 404 page.
- Click a card from the homepage grid/carousel (Task 12/13) — confirm it now lands on a working reading page instead of 404.

- [ ] **Step 4: Full build check**

Run: `npm run build`
Expected: build succeeds, and the output log shows the 12 `/horoscope/[sign]` routes as prerendered (○ or ● markers next to each of the 12 static params) — this is the first point in the plan where `generateStaticParams` actually gets exercised at build time, so it's worth confirming here rather than only in dev.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/horoscope/HoroscopeReading.tsx "src/app/horoscope"
git commit -m "feat(horoscope): add per-sign daily reading page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 15: `/predictions/daily-horoscope` index page (wires up the existing nav link)

**Files:**
- Create: `src/app/predictions/daily-horoscope/page.tsx`

**Interfaces:**
- Consumes: `ZodiacGrid` from `@/components/horoscope/ZodiacGrid`; `ZodiacCarousel` from `@/components/horoscope/ZodiacCarousel`; `LotusIcon` from `@/components/quick-services/icons`.

- [ ] **Step 1: Write the page**

```tsx
// src/app/predictions/daily-horoscope/page.tsx
import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { ZodiacGrid } from "@/components/horoscope/ZodiacGrid";
import { ZodiacCarousel } from "@/components/horoscope/ZodiacCarousel";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Daily Horoscope | TRUELOGER",
  description:
    "Choose your zodiac sign for today's horoscope — love, career, finance and health, refreshed daily.",
};

// Wires up the nav/quick-services "Daily Horoscope" link (previously
// dead — see nav-data.ts / quick-services-data.ts) into the same
// zodiac-selection UI as the homepage section, as its own full page.
export default function DailyHoroscopeIndexPage() {
  return (
    <section
      aria-labelledby="daily-horoscope-index-heading"
      className="relative bg-nav-ivory px-4 py-12 sm:px-6 md:px-8 md:py-20"
    >
      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h1
            id="daily-horoscope-index-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Daily <span className="text-nav-amethyst">Horoscope</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Choose your zodiac sign for today&apos;s reading.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <ZodiacGrid />
          <ZodiacCarousel />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Browser check**

Visit `http://localhost:3000/predictions/daily-horoscope` directly — confirm the same 12-card grid/carousel as the homepage section, each card linking to its `/horoscope/[sign]` page. Then check the site nav: open the "Predictions" dropdown and click "Daily Horoscope" — confirm it now lands here instead of 404ing.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/predictions"
git commit -m "feat(horoscope): add daily-horoscope index page, wire up nav link

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LJ9BUagXvqtGACdRak4MyD"
```

---

### Task 16: Final verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full type-check, lint, and build**

```bash
npx tsc --noEmit
npx eslint src
npm run build
```
Expected: all three succeed with no errors. The build output should show 12 static `/horoscope/[sign]` routes plus `/predictions/daily-horoscope` and `/` among the built routes.

- [ ] **Step 2: Re-run the pure-logic tests**

```bash
node src/lib/horoscope/zodiac.test.ts
node src/lib/horoscope/validate.test.ts
node src/lib/horoscope/date.test.ts
node src/lib/horoscope/openrouter.test.ts
```
Expected: all four print their "all assertions passed" line.

- [ ] **Step 3: Cron auth check (regression)**

Run `npm run dev`, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/cron/generate-horoscopes
```
Expected: `401`.

- [ ] **Step 4: Full homepage flow, desktop**

At a desktop width: Header → Hero carousel → dome/lotus divider → Daily Horoscope heading + 6×2 grid → QuickServices (unchanged) → ExploreServices → PersonalizedReportsBanner → HealingSection → Puja → Products → Courses, in that exact order, with no visible seams.

- [ ] **Step 5: Full homepage flow, mobile**

At 320px, 375px, and 430px: same section order, Horoscope shows the 4-visible swipeable carousel, no page-level horizontal scrollbar anywhere on the page.

- [ ] **Step 6: End-to-end click-through**

From the homepage: click a zodiac card → lands on that sign's `/horoscope/[slug]` page with real content. Navigate to `/predictions/daily-horoscope` via the nav dropdown → click a different sign → lands on its reading page.

- [ ] **Step 7: Confirm no secrets in client bundle**

```bash
grep -r "OPENROUTER_API_KEY_PAID\|FIREBASE_ADMIN_PRIVATE_KEY" .next/static 2>/dev/null
```
Expected: no output (after `npm run build`, `.next/static` holds the client bundles — these strings must not appear there).

- [ ] **Step 8: Commit any final fixes**

If any of the above surfaced issues and required fixes, commit them now with a message describing what was fixed. If everything passed as-is, there's nothing to commit for this task.
