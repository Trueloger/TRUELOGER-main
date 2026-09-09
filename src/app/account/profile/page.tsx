"use client";

// src/app/account/profile/page.tsx
// Signed-in user's Profile overview + inline edit. Read-only summary at
// the top, a completion meter, then two toggle-to-edit sections
// (Personal Details, Birth Details) that both save via the existing
// PUT /api/profile endpoint. Reuses the shared forms/ field components
// (DateOfBirthField, TimeOfBirthField, PlaceOfBirthField, NameField)
// so the picker UI matches every other birth-details form on the site
// exactly, instead of re-implementing date/time pickers here.
//
// No astrology results (Rashi/Nakshatra/Ascendant) are shown — this
// repo doesn't persist per-user chart output anywhere reachable from
// the profile, so fabricating placeholder values here would be worse
// than omitting the section entirely.
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Cake,
  Calendar,
  Check,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import {
  profileCompletionPercent,
  isProfileComplete as computeIsProfileComplete,
  type Gender,
  type UserProfile,
} from "@/lib/profile/types";
import { NameField, validateName } from "@/components/forms/NameField";
import { DateOfBirthField, validateDateOfBirth } from "@/components/forms/DateOfBirthField";
import { TimeOfBirthField, validateTimeOfBirth } from "@/components/forms/TimeOfBirthField";
import { PlaceOfBirthField, validatePlaceOfBirth } from "@/components/forms/PlaceOfBirthField";
import { fieldLabelClass, fieldInputClass, fieldErrorTextClass } from "@/components/forms/field-styles";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatDob(dob?: string): string {
  if (!dob) return "Not provided";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return dob;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatTime(time?: string, unknown?: boolean): string {
  if (unknown) return "Unknown";
  if (!time) return "Not provided";
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return time;
  const h = Number(match[1]);
  const m = match[2];
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

function formatBirthPlace(profile: UserProfile | null): string {
  if (!profile) return "Not provided";
  const parts = [profile.birthCity, profile.birthState, profile.birthCountry].filter(
    (p) => typeof p === "string" && p.trim().length > 0
  );
  return parts.length > 0 ? parts.join(", ") : "Not provided";
}

/** Friendly wrapper — never surfaces a raw fetch/API error string. */
async function savePartialProfile(partial: Partial<UserProfile>): Promise<void> {
  let res: Response;
  try {
    res = await authedFetch("/api/profile", { method: "PUT", body: JSON.stringify(partial) });
  } catch {
    throw new Error("You need to be signed in to save changes.");
  }
  if (!res.ok) {
    throw new Error("Couldn't save your changes. Please try again.");
  }
}

export default function AccountProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { currentUser, profile } = useAuth();
  const completion = profileCompletionPercent(profile);
  const complete = computeIsProfileComplete(profile);

  return (
    <main className="min-h-screen bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <UserIcon className="h-6 w-6 text-nav-amethyst" strokeWidth={1.3} aria-hidden="true" />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl">
          My Profile
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-[0.95rem] text-nav-plum/80">
          Your details, kept accurate for every reading and report.
        </p>

        <div className="mt-8 space-y-6">
          <SummaryCard currentUser={currentUser} profile={profile} />
          <CompletionCard percent={completion} complete={complete} />
          <PersonalDetailsCard profile={profile} />
          <BirthDetailsCard profile={profile} />
        </div>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 shadow-[0_10px_30px_-14px_rgba(70,40,120,0.25)] sm:p-6">
      {children}
    </section>
  );
}

function CardHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-nav-lavender-line pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nav-lavender-soft text-nav-amethyst-deep">
          {icon}
        </span>
        <h2 className="font-serif text-lg text-nav-violet">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function SummaryCard({
  currentUser,
  profile,
}: {
  currentUser: ReturnType<typeof useAuth>["currentUser"];
  profile: UserProfile | null;
}) {
  const name = profile?.fullName || currentUser?.displayName || "Your name";
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-1">
        <div>
          <p className="font-serif text-xl text-nav-violet">{name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-nav-plum/70">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {currentUser?.email ?? "Not available"}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-nav-lavender-line pt-4 sm:grid-cols-2">
        <SummaryRow icon={<Cake className="h-4 w-4" />} label="Date of Birth" value={formatDob(profile?.dob)} />
        <SummaryRow
          icon={<Clock className="h-4 w-4" />}
          label="Time of Birth"
          value={formatTime(profile?.timeOfBirth, profile?.timeUnknown)}
        />
        <SummaryRow
          icon={<MapPin className="h-4 w-4" />}
          label="Birth Place"
          value={formatBirthPlace(profile)}
        />
      </dl>
    </Card>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-nav-amethyst" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="text-xs text-nav-plum/60">{label}</dt>
        <dd className="text-sm font-medium text-nav-plum">{value}</dd>
      </div>
    </div>
  );
}

function CompletionCard({ percent, complete }: { percent: number; complete: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nav-lavender-soft text-nav-amethyst-deep">
            <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-serif text-lg text-nav-violet">Profile Completion</p>
            <p className="text-xs text-nav-plum/60">
              {complete ? "Your profile is ready for accurate readings." : "A few details are still missing."}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-semibold text-nav-amethyst-deep">{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-nav-lavender-soft"
      >
        <div
          className="h-full rounded-full bg-nav-amethyst transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>

      {!complete && (
        <Link
          href="/profile/complete"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
        >
          Complete Profile
        </Link>
      )}
    </Card>
  );
}

/* ---------------------------- Personal Details ---------------------------- */

type PersonalDraft = {
  fullName: string;
  phone: string;
  gender: Gender | "";
  country: string;
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function draftFromProfile(profile: UserProfile | null): PersonalDraft {
  return {
    fullName: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    gender: profile?.gender ?? "",
    country: profile?.country ?? "",
  };
}

function PersonalDetailsCard({ profile }: { profile: UserProfile | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PersonalDraft>(() => draftFromProfile(profile));
  const [nameError, setNameError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  // Tracks the last `profile` reference the draft was synced from — lets
  // the draft re-sync when the live Firestore doc changes (e.g. another
  // tab's edit) without touching it while the user is actively editing.
  // Setting state directly in the render body (not an effect) is the
  // React-recommended way to derive state from a changed prop.
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (profile !== syncedProfile && !editing) {
    setSyncedProfile(profile);
    setDraft(draftFromProfile(profile));
  }

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(t);
  }, [justSaved]);

  function startEdit() {
    setDraft(draftFromProfile(profile));
    setNameError(null);
    setStatus("idle");
    setErrorMessage(null);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(draftFromProfile(profile));
    setNameError(null);
    setStatus("idle");
    setErrorMessage(null);
    setEditing(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nameErr = validateName(draft.fullName, { label: "Full name" });
    setNameError(nameErr);
    if (nameErr) return;

    setStatus("saving");
    setErrorMessage(null);
    try {
      const payload: Partial<UserProfile> = {
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        country: draft.country.trim(),
      };
      if (draft.gender) payload.gender = draft.gender;
      await savePartialProfile(payload);
      setStatus("saved");
      setEditing(false);
      setJustSaved(true);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Couldn't save your changes. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<UserIcon className="h-4.5 w-4.5" aria-hidden="true" />}
        title="Personal Details"
        action={
          !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="flex min-h-9 items-center gap-1.5 rounded-full border border-nav-lavender-line px-3.5 py-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:bg-nav-lavender-soft"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          )
        }
      />

      {justSaved && !editing && <SavedNote />}

      {!editing ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StaticRow label="Full Name" value={profile?.fullName || "Not provided"} />
          <StaticRow label="Phone" value={profile?.phone || "Not provided"} />
          <StaticRow
            label="Gender"
            value={GENDER_OPTIONS.find((g) => g.value === profile?.gender)?.label ?? "Not provided"}
          />
          <StaticRow label="Country" value={profile?.country || "Not provided"} />
        </dl>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <NameField
            value={draft.fullName}
            onChange={(value) => setDraft((d) => ({ ...d, fullName: value }))}
            error={nameError}
            id="account-profile-fullname"
          />

          <div>
            <label htmlFor="account-profile-phone" className={fieldLabelClass}>
              Phone
            </label>
            <input
              id="account-profile-phone"
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              placeholder="e.g. +91 98765 43210"
              maxLength={20}
              autoComplete="tel"
              className={`mt-1.5 ${fieldInputClass}`}
            />
          </div>

          <div>
            <label htmlFor="account-profile-gender" className={fieldLabelClass}>
              Gender
            </label>
            <select
              id="account-profile-gender"
              value={draft.gender}
              onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as Gender | "" }))}
              className={`mt-1.5 ${fieldInputClass}`}
            >
              <option value="">Not specified</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="account-profile-country" className={fieldLabelClass}>
              Country
            </label>
            <input
              id="account-profile-country"
              type="text"
              value={draft.country}
              onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
              placeholder="e.g. India"
              maxLength={80}
              autoComplete="country-name"
              className={`mt-1.5 ${fieldInputClass}`}
            />
          </div>

          {status === "error" && errorMessage && <p className={fieldErrorTextClass}>{errorMessage}</p>}

          <SaveCancelRow status={status} onCancel={cancelEdit} />
        </form>
      )}
    </Card>
  );
}

/* ----------------------------- Birth Details ----------------------------- */

type BirthDraft = {
  dob: string;
  timeOfBirth: string;
  timeUnknown: boolean;
  birthCity: string;
  birthState: string;
  birthCountry: string;
};

function birthDraftFromProfile(profile: UserProfile | null): BirthDraft {
  return {
    dob: profile?.dob ?? "",
    timeOfBirth: profile?.timeOfBirth ?? "",
    timeUnknown: profile?.timeUnknown ?? false,
    birthCity: profile?.birthCity ?? "",
    birthState: profile?.birthState ?? "",
    birthCountry: profile?.birthCountry ?? "",
  };
}

function BirthDetailsCard({ profile }: { profile: UserProfile | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BirthDraft>(() => birthDraftFromProfile(profile));
  const [errors, setErrors] = useState<{ dob?: string | null; time?: string | null; city?: string | null }>({});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (profile !== syncedProfile && !editing) {
    setSyncedProfile(profile);
    setDraft(birthDraftFromProfile(profile));
  }

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 3000);
    return () => clearTimeout(t);
  }, [justSaved]);

  function startEdit() {
    setDraft(birthDraftFromProfile(profile));
    setErrors({});
    setStatus("idle");
    setErrorMessage(null);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(birthDraftFromProfile(profile));
    setErrors({});
    setStatus("idle");
    setErrorMessage(null);
    setEditing(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const dobError = validateDateOfBirth(draft.dob);
    const timeError = draft.timeUnknown ? null : validateTimeOfBirth(draft.timeOfBirth);
    const placeErrors = validatePlaceOfBirth({
      city: draft.birthCity,
      state: draft.birthState,
      country: draft.birthCountry,
    });
    setErrors({ dob: dobError, time: timeError, city: placeErrors.city });
    if (dobError || timeError || placeErrors.city) return;

    setStatus("saving");
    setErrorMessage(null);
    try {
      await savePartialProfile({
        dob: draft.dob,
        timeOfBirth: draft.timeUnknown ? "" : draft.timeOfBirth,
        timeUnknown: draft.timeUnknown,
        birthCity: draft.birthCity.trim(),
        birthState: draft.birthState.trim(),
        birthCountry: draft.birthCountry.trim(),
      });
      setStatus("saved");
      setEditing(false);
      setJustSaved(true);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Couldn't save your changes. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<Calendar className="h-4.5 w-4.5" aria-hidden="true" />}
        title="Birth Details"
        action={
          !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="flex min-h-9 items-center gap-1.5 rounded-full border border-nav-lavender-line px-3.5 py-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:bg-nav-lavender-soft"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          )
        }
      />

      {justSaved && !editing && <SavedNote />}

      {!editing ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StaticRow label="Date of Birth" value={formatDob(profile?.dob)} />
          <StaticRow label="Time of Birth" value={formatTime(profile?.timeOfBirth, profile?.timeUnknown)} />
          <StaticRow label="Birth Place" value={formatBirthPlace(profile)} />
        </dl>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-5">
          <DateOfBirthField
            value={draft.dob}
            onChange={(value) => setDraft((d) => ({ ...d, dob: value }))}
            error={errors.dob}
            id="account-profile-dob"
          />
          <TimeOfBirthField
            value={draft.timeOfBirth}
            onChange={(value) => setDraft((d) => ({ ...d, timeOfBirth: value }))}
            error={errors.time}
            unknown={draft.timeUnknown}
            onUnknownChange={(unknown) => setDraft((d) => ({ ...d, timeUnknown: unknown }))}
            id="account-profile-time"
          />
          <PlaceOfBirthField
            city={draft.birthCity}
            state={draft.birthState}
            country={draft.birthCountry}
            onCityChange={(value) => setDraft((d) => ({ ...d, birthCity: value }))}
            onStateChange={(value) => setDraft((d) => ({ ...d, birthState: value }))}
            onCountryChange={(value) => setDraft((d) => ({ ...d, birthCountry: value }))}
            onCityAndStateChange={(city, state) => setDraft((d) => ({ ...d, birthCity: city, birthState: state }))}
            errors={{ city: errors.city ?? undefined }}
            idPrefix="account-profile-place"
          />

          <p className="text-xs text-nav-plum/60">
            Updating your birth details only affects future reports — past orders and reports are not changed.
          </p>

          {status === "error" && errorMessage && <p className={fieldErrorTextClass}>{errorMessage}</p>}

          <SaveCancelRow status={status} onCancel={cancelEdit} />
        </form>
      )}
    </Card>
  );
}

/* ------------------------------ Shared bits ------------------------------ */

function SavedNote() {
  return (
    <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-nav-lavender-soft px-3 py-2 text-sm font-medium text-nav-amethyst-deep">
      <Check className="h-4 w-4" aria-hidden="true" />
      Saved.
    </p>
  );
}

function StaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-nav-plum/60">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-nav-plum">{value}</dd>
    </div>
  );
}

function SaveCancelRow({ status, onCancel }: { status: SaveStatus; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 border-t border-nav-lavender-line pt-4">
      <button
        type="submit"
        disabled={status === "saving"}
        className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "saving" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Save Changes
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={status === "saving"}
        className="flex min-h-11 items-center gap-1.5 rounded-full border border-nav-lavender-line px-4 py-2.5 text-sm font-medium text-nav-plum/80 transition-colors duration-150 hover:bg-nav-lavender-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Cancel
      </button>
    </div>
  );
}
