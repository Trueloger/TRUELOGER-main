"use client";

// src/app/profile/complete/page.tsx
// The required post-signup step: this site never drops a freshly
// created account straight into the app with an empty profile. Guards
// on auth state (redirect to /login when signed out, straight through
// to the destination when the profile is already complete), then
// renders a mobile-first, sectioned form and PUTs whatever was filled
// in to /api/profile — birth coordinates/timezone are resolved
// server-side from birthCity, never computed or sent from here.
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/auth/authed-fetch";
import {
  profileCompletionPercent,
  missingRequiredFields,
  type Gender,
  type UserProfile,
} from "@/lib/profile/types";
import { LotusIcon } from "@/components/quick-services/icons";
import { fieldLabelClass, fieldInputClass } from "@/components/forms/field-styles";
import { NameField } from "@/components/forms/NameField";
import { DateOfBirthField } from "@/components/forms/DateOfBirthField";
import { TimeOfBirthField } from "@/components/forms/TimeOfBirthField";
import { PlaceOfBirthField } from "@/components/forms/PlaceOfBirthField";
import { SIGNUP_PHONE_HANDOFF_KEY } from "@/app/signup/page";

/** Only ever redirect to a same-origin relative path — never let a
 * `?redirect=` query param send a user off-site (open redirect).
 * `//evil.com` is rejected too since browsers treat a leading `//` as
 * protocol-relative. */
function safeRedirectPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

type FormState = {
  fullName: string;
  phone: string;
  gender: Gender | "";
  country: string;
  dob: string;
  timeOfBirth: string;
  timeUnknown: boolean;
  birthCity: string;
  birthState: string;
  birthCountry: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  gender: "",
  country: "",
  dob: "",
  timeOfBirth: "",
  timeUnknown: false,
  birthCity: "",
  birthState: "",
  birthCountry: "",
};

function toProfilePartial(form: FormState): Partial<UserProfile> {
  return {
    fullName: form.fullName,
    phone: form.phone,
    gender: form.gender || undefined,
    country: form.country,
    dob: form.dob,
    timeOfBirth: form.timeOfBirth,
    timeUnknown: form.timeUnknown,
    birthCity: form.birthCity,
    birthState: form.birthState,
    birthCountry: form.birthCountry,
  };
}

function LoadingShell({ label }: { label: string }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4">
      <p className="text-sm text-nav-plum/70">{label}</p>
    </main>
  );
}

function ProfileCompleteForm() {
  const { currentUser, profile, loading, isProfileComplete } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Redirect guards. Only act once `loading` has settled, so a
  // genuinely signed-in user isn't bounced to /login while the auth
  // listener is still resolving on a hard refresh.
  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (isProfileComplete) {
      router.replace(safeRedirectPath(redirectParam) ?? "/account/profile");
    }
  }, [loading, currentUser, isProfileComplete, redirectParam, router]);

  // Pre-fill from whatever profile data already exists (a returning
  // user with a partially-saved profile) plus the account's display
  // name and any mobile number handed off from /signup. This adjusts
  // state during render (the React-docs-recommended pattern for
  // "resetting/adjusting state when a prop changes") rather than in an
  // effect, since the Firestore profile snapshot can arrive after this
  // component's first render and a plain useEffect+setState here would
  // trigger a cascading extra render for no benefit. Stops re-syncing
  // the moment the user actually edits a field.
  const profileHydrationKey = !currentUser ? "none" : profile ? "loaded" : "empty";
  const [lastHydrationKey, setLastHydrationKey] = useState(profileHydrationKey);
  if (!dirty && currentUser && profileHydrationKey !== lastHydrationKey) {
    setLastHydrationKey(profileHydrationKey);

    let phone = profile?.phone ?? "";
    if (!phone) {
      try {
        const stored = sessionStorage.getItem(SIGNUP_PHONE_HANDOFF_KEY);
        if (stored) {
          phone = stored;
          sessionStorage.removeItem(SIGNUP_PHONE_HANDOFF_KEY);
        }
      } catch {
        // Ignore — the phone pre-fill is a convenience, not required.
      }
    }

    setForm({
      fullName: profile?.fullName ?? currentUser.displayName ?? "",
      phone,
      gender: profile?.gender ?? "",
      country: profile?.country ?? "",
      dob: profile?.dob ?? "",
      timeOfBirth: profile?.timeOfBirth ?? "",
      timeUnknown: profile?.timeUnknown ?? false,
      birthCity: profile?.birthCity ?? "",
      birthState: profile?.birthState ?? "",
      birthCountry: profile?.birthCountry ?? "",
    });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  }

  const percent = profileCompletionPercent(toProfilePartial(form));
  const missing = missingRequiredFields(toProfilePartial(form));
  const birthDetailsIncomplete = missing.length > 0;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaving(true);

    try {
      const body: Partial<UserProfile> = { timeUnknown: form.timeUnknown };
      if (form.fullName.trim()) body.fullName = form.fullName.trim();
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.gender) body.gender = form.gender;
      if (form.country.trim()) body.country = form.country.trim();
      if (form.dob) body.dob = form.dob;
      if (!form.timeUnknown && form.timeOfBirth) body.timeOfBirth = form.timeOfBirth;
      if (form.birthCity.trim()) body.birthCity = form.birthCity.trim();
      if (form.birthState.trim()) body.birthState = form.birthState.trim();
      if (form.birthCountry.trim()) body.birthCountry = form.birthCountry.trim();

      const res = await authedFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Save failed with status ${res.status}`);
      }

      router.replace(safeRedirectPath(redirectParam) ?? "/account/profile");
    } catch {
      setSaving(false);
      setSaveError("We couldn't save your profile. Please check your connection and try again.");
    }
  }

  if (loading || !currentUser || isProfileComplete) {
    return <LoadingShell label={loading ? "Loading…" : "Redirecting…"} />;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-[1.75rem] leading-tight text-nav-violet sm:text-3xl">
          Complete Your Profile
        </h1>
        <p className="mt-2 text-center text-sm text-nav-plum/70">
          A few details help us personalize every reading and calculation for you.
        </p>

        {/* Completion indicator */}
        <div className="mt-6 rounded-2xl border border-nav-lavender-line bg-nav-pearl p-4 sm:p-5">
          <div className="flex items-center justify-between text-sm font-medium text-nav-plum">
            <span>Profile {percent}% complete</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-nav-lavender-soft"
          >
            <div
              className="h-full rounded-full bg-nav-amethyst motion-safe:transition-[width] motion-safe:duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSave} noValidate className="mt-6 space-y-6">
          {saveError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {saveError}
            </div>
          )}

          {/* Personal */}
          <section className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 sm:p-6">
            <h2 className="font-serif text-lg text-nav-violet">Personal</h2>
            <div className="mt-4 space-y-4">
              <NameField
                id="profile-fullname"
                value={form.fullName}
                onChange={(value) => update("fullName", value)}
              />

              <div>
                <label htmlFor="profile-phone" className={fieldLabelClass}>
                  Phone{" "}
                  <span className="text-xs font-normal text-nav-plum/50">(optional)</span>
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  maxLength={20}
                  autoComplete="tel"
                  className={`mt-1.5 ${fieldInputClass}`}
                />
              </div>

              <div>
                <label htmlFor="profile-gender" className={fieldLabelClass}>
                  Gender{" "}
                  <span className="text-xs font-normal text-nav-plum/50">(optional)</span>
                </label>
                <select
                  id="profile-gender"
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value as Gender | "")}
                  className={`mt-1.5 ${fieldInputClass}`}
                >
                  <option value="">Select (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label htmlFor="profile-country" className={fieldLabelClass}>
                  Country{" "}
                  <span className="text-xs font-normal text-nav-plum/50">(optional)</span>
                </label>
                <input
                  id="profile-country"
                  type="text"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  placeholder="e.g. India"
                  maxLength={80}
                  autoComplete="country-name"
                  className={`mt-1.5 ${fieldInputClass}`}
                />
              </div>
            </div>
          </section>

          {/* Birth Details */}
          <section className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 sm:p-6">
            <h2 className="font-serif text-lg text-nav-violet">Birth Details</h2>
            <p className="mt-1 text-xs text-nav-plum/60">
              Required for every astrology tool on this site — Kundli, Nakshatra, Dasha,
              Compatibility, and more.
            </p>
            <div className="mt-4 space-y-4">
              <DateOfBirthField
                id="profile-dob"
                value={form.dob}
                onChange={(value) => update("dob", value)}
              />

              <TimeOfBirthField
                id="profile-time"
                value={form.timeOfBirth}
                onChange={(value) => update("timeOfBirth", value)}
                unknown={form.timeUnknown}
                onUnknownChange={(unknown) => {
                  update("timeUnknown", unknown);
                  if (unknown) update("timeOfBirth", "");
                }}
              />

              <PlaceOfBirthField
                idPrefix="profile-place"
                city={form.birthCity}
                state={form.birthState}
                country={form.birthCountry}
                onCityChange={(value) => update("birthCity", value)}
                onStateChange={(value) => update("birthState", value)}
                onCountryChange={(value) => update("birthCountry", value)}
                onCityAndStateChange={(city, state) => {
                  setDirty(true);
                  setForm((f) => ({ ...f, birthCity: city, birthState: state }));
                }}
              />
            </div>

            {birthDetailsIncomplete && (
              <p className="mt-4 rounded-xl border border-nav-lavender-line bg-nav-lavender-mist px-3.5 py-2.5 text-xs text-nav-plum/80">
                You can save now and fill this in later, but complete your birth details (city,
                country and date of birth, plus time of birth unless unknown) before using any
                chart-based tool.
              </p>
            )}
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving profile…" : "Save & Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ProfileCompletePage() {
  return (
    <Suspense fallback={<LoadingShell label="Loading…" />}>
      <ProfileCompleteForm />
    </Suspense>
  );
}
