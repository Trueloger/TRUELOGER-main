"use client";

// src/app/account/settings/page.tsx
// Signed-in user's Account Settings: Account (name/email/phone),
// Security (email verification, password change, logout), Preferences
// (notifications/language), and a de-emphasized Account Deletion
// section. Every security-sensitive action (password change, account
// deletion) goes through Firebase Auth's own required flow —
// reauthenticateWithCredential before updatePassword/deleteUser — never
// a raw Firestore write. See AGENTS-owned AuthContext.tsx / firebase-
// client.ts, both read-only imports here.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Check,
  Globe,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  X,
} from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  type AuthError,
} from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { firebaseAuth } from "@/lib/firebase-client";
import { authedFetch } from "@/lib/auth/authed-fetch";
import type { UserProfile } from "@/lib/profile/types";
import { fieldLabelClass, fieldInputClass, fieldInputErrorClass, fieldErrorTextClass } from "@/components/forms/field-styles";

type Status = "idle" | "saving" | "saved" | "error";

/** Plain-English mapping for the Firebase Auth error codes this page's
 * flows can actually hit — never surface `error.code`/`error.message`
 * raw to the user. */
function mapAuthError(err: unknown): string {
  const code = (err as AuthError)?.code;
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Your current password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password — at least 6 characters.";
    case "auth/requires-recent-login":
      return "For your security, please log out and log back in, then try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

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

export default function AccountSettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <ShieldCheck className="h-6 w-6 text-nav-amethyst" strokeWidth={1.3} aria-hidden="true" />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl">
          Account Settings
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-[0.95rem] text-nav-plum/80">
          Manage your account, security, and preferences.
        </p>

        <div className="mt-8 space-y-6">
          <AccountSection />
          <SecuritySection />
          <PreferencesSection />
          <DeleteAccountSection />
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

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-nav-lavender-line pb-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nav-lavender-soft text-nav-amethyst-deep">
        {icon}
      </span>
      <h2 className="font-serif text-lg text-nav-violet">{title}</h2>
    </div>
  );
}

function SaveButton({ status, label = "Save" }: { status: Status; label?: string }) {
  return (
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
          {label}
        </>
      )}
    </button>
  );
}

/* -------------------------------- Account -------------------------------- */

function AccountSection() {
  const { currentUser, profile } = useAuth();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  // Re-derives `phone` from the live profile when it changes underneath
  // (e.g. another tab), without clobbering in-progress typing — setting
  // state directly in the render body (not an effect) is the React-
  // recommended way to derive state from a changed prop.
  const [syncedPhone, setSyncedPhone] = useState(profile?.phone);
  if (profile?.phone !== syncedPhone) {
    setSyncedPhone(profile?.phone);
    setPhone(profile?.phone ?? "");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await savePartialProfile({ phone: phone.trim() });
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't save your changes. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader icon={<UserIcon className="h-4.5 w-4.5" aria-hidden="true" />} title="Account" />

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label className={fieldLabelClass}>Name</label>
          <p className="mt-1.5 rounded-xl border border-nav-lavender-line bg-nav-lavender-mist px-4 py-2.5 text-[0.95rem] text-nav-plum/80">
            {profile?.fullName || currentUser?.displayName || "Not provided"}
          </p>
        </div>

        <div>
          <label className={fieldLabelClass}>Email</label>
          <p className="mt-1.5 flex items-center gap-2 rounded-xl border border-nav-lavender-line bg-nav-lavender-mist px-4 py-2.5 text-[0.95rem] text-nav-plum/80">
            <Mail className="h-4 w-4 shrink-0 text-nav-plum/50" aria-hidden="true" />
            {currentUser?.email ?? "Not available"}
          </p>
          <p className="mt-1.5 text-xs text-nav-plum/60">Contact support to change your email.</p>
        </div>

        <div>
          <label htmlFor="account-settings-phone" className={fieldLabelClass}>
            Phone
          </label>
          <input
            id="account-settings-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            maxLength={20}
            autoComplete="tel"
            className={`mt-1.5 ${fieldInputClass}`}
          />
        </div>

        {status === "error" && error && <p className={fieldErrorTextClass}>{error}</p>}
        {status === "saved" && <p className="text-sm font-medium text-nav-amethyst-deep">Saved.</p>}

        <SaveButton status={status} />
      </form>
    </Card>
  );
}

/* ------------------------------- Security -------------------------------- */

const RESEND_COOLDOWN_SECONDS = 60;

function SecuritySection() {
  const { currentUser, resendVerificationEmail, logout } = useAuth();
  const router = useRouter();

  const [verified, setVerified] = useState<boolean>(currentUser?.emailVerified ?? false);
  // Derives `verified` from the AuthContext user (updated on refresh
  // via the "refresh status" button below, or the next natural token
  // refresh) — set in the render body rather than an effect, the
  // React-recommended way to derive state from a changed prop.
  const [syncedVerified, setSyncedVerified] = useState(currentUser?.emailVerified);
  if (currentUser?.emailVerified !== syncedVerified) {
    setSyncedVerified(currentUser?.emailVerified);
    setVerified(currentUser?.emailVerified ?? false);
  }

  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<Status>("idle");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleResend() {
    setResendStatus("saving");
    try {
      await resendVerificationEmail();
      setResendStatus("saved");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendStatus("error");
    }
  }

  async function handleRefreshStatus() {
    setRefreshing(true);
    try {
      await firebaseAuth.currentUser?.reload();
      setVerified(firebaseAuth.currentUser?.emailVerified ?? false);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <Card>
      <CardHeader icon={<ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />} title="Security" />

      <div className="mt-4 space-y-5">
        {/* Email verification */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                Not verified
              </span>
            )}
            <span className="text-sm text-nav-plum/70">Email verification</span>
          </div>

          {!verified && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === "saving" || cooldown > 0}
                className="flex min-h-10 items-center gap-1.5 rounded-full border border-nav-lavender-line px-4 py-2 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:bg-nav-lavender-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendStatus === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
              </button>
              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-nav-plum/70 transition-colors duration-150 hover:bg-nav-lavender-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing && <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                I&apos;ve verified, refresh status
              </button>
            </div>
          )}
          {resendStatus === "saved" && cooldown > 0 && (
            <p className="mt-2 text-xs text-nav-plum/60">Verification email sent — check your inbox.</p>
          )}
          {resendStatus === "error" && (
            <p className="mt-2 text-xs text-red-600">Couldn&apos;t send the email. Please try again shortly.</p>
          )}
        </div>

        <ChangePasswordForm />

        <div className="border-t border-nav-lavender-line pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 items-center gap-2 rounded-full border border-nav-lavender-line px-5 py-2.5 text-sm font-medium text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>
    </Card>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    const user = firebaseAuth.currentUser;
    if (!user?.email) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setStatus("saving");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatus("error");
      setError(mapAuthError(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border-t border-nav-lavender-line pt-4">
      <p className={fieldLabelClass}>Change Password</p>
      <div className="mt-2 space-y-3">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          required
          className={fieldInputClass}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          minLength={6}
          required
          className={fieldInputClass}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          minLength={6}
          required
          className={fieldInputClass}
        />
      </div>

      {error && <p className={fieldErrorTextClass}>{error}</p>}
      {status === "saved" && <p className="mt-1.5 text-sm font-medium text-nav-amethyst-deep">Password updated.</p>}

      <div className="mt-3">
        <SaveButton status={status} label="Update Password" />
      </div>
    </form>
  );
}

/* ------------------------------ Preferences ------------------------------- */

function PreferencesSection() {
  const { profile } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notificationsEnabled ?? true);
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage ?? "English");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  // Derives both fields from the live profile — set in the render body
  // rather than an effect, the React-recommended way to derive state
  // from a changed prop.
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (profile !== syncedProfile) {
    setSyncedProfile(profile);
    setNotificationsEnabled(profile?.notificationsEnabled ?? true);
    setPreferredLanguage(profile?.preferredLanguage ?? "English");
  }

  async function handleToggleNotifications(next: boolean) {
    setNotificationsEnabled(next);
    setStatus("saving");
    setError(null);
    try {
      await savePartialProfile({ notificationsEnabled: next });
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't save your changes. Please try again.");
    }
  }

  async function handleSubmitLanguage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await savePartialProfile({ preferredLanguage });
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't save your changes. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader icon={<Bell className="h-4.5 w-4.5" aria-hidden="true" />} title="Preferences" />

      <div className="mt-4 space-y-5">
        <label
          htmlFor="account-settings-notifications"
          className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-nav-lavender-line px-4 py-3"
        >
          <span className="text-sm text-nav-plum">Email notifications</span>
          <input
            id="account-settings-notifications"
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => handleToggleNotifications(e.target.checked)}
            className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-nav-lavender-line transition-colors duration-150 checked:bg-nav-amethyst before:block before:h-4 before:w-4 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-white before:shadow before:transition-transform before:duration-150 checked:before:translate-x-[1.125rem] motion-reduce:transition-none motion-reduce:before:transition-none"
          />
        </label>

        <form onSubmit={handleSubmitLanguage} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="account-settings-language" className={fieldLabelClass}>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                Preferred language
              </span>
            </label>
            <select
              id="account-settings-language"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className={`mt-1.5 ${fieldInputClass}`}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
          <SaveButton status={status} />
        </form>

        {status === "error" && error && <p className={fieldErrorTextClass}>{error}</p>}
      </div>
    </Card>
  );
}

/* --------------------------- Account Deletion ----------------------------- */

function DeleteAccountSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-nav-lavender-line/70 bg-nav-lavender-mist/40 p-5 sm:p-6">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-nav-plum/50">
          <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-nav-plum">Delete Account</h2>
          <p className="mt-1 text-xs text-nav-plum/60">
            Permanently delete your account and profile. This can&apos;t be undone.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 min-h-9 rounded-full border border-nav-plum/20 px-4 py-1.5 text-sm font-medium text-nav-plum/70 transition-colors duration-150 hover:border-red-300 hover:text-red-600"
          >
            Delete my account
          </button>
        </div>
      </div>

      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </section>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const confirmed = confirmText.trim().toUpperCase() === "DELETE";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function handleDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!confirmed) {
      setError('Type "DELETE" to confirm.');
      return;
    }
    const user = firebaseAuth.currentUser;
    if (!user?.email) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setStatus("saving");
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Delete the Firestore profile doc first (needs the still-valid
      // session's ID token) — order/report records are a separate
      // collection and are intentionally left untouched.
      try {
        await authedFetch("/api/profile", { method: "DELETE" });
      } catch {
        // Non-fatal — proceed to delete the Auth account regardless;
        // an orphaned profile doc is a lesser problem than a user who
        // asked to delete their account and couldn't.
      }

      await deleteUser(user);
      await logout();
      router.push("/");
    } catch (err) {
      setStatus("error");
      setError(mapAuthError(err));
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-nav-violet/30 backdrop-blur-[1px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Delete account"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-nav-lavender-line bg-nav-pearl p-6 shadow-2xl outline-none sm:rounded-2xl sm:border"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl text-nav-violet">Delete your account?</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nav-plum/60 transition-colors duration-150 hover:bg-nav-lavender-soft"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-nav-plum/80">
          This permanently deletes your account ({currentUser?.email}) and profile. Your order history is
          retained for business and legal records. This can&apos;t be undone.
        </p>

        <form onSubmit={handleDelete} noValidate className="mt-4 space-y-3">
          <div>
            <label htmlFor="delete-account-password" className={fieldLabelClass}>
              Confirm your password
            </label>
            <input
              id="delete-account-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={`mt-1.5 ${fieldInputClass}`}
            />
          </div>

          <div>
            <label htmlFor="delete-account-confirm" className={fieldLabelClass}>
              Type DELETE to confirm
            </label>
            <input
              id="delete-account-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              required
              className={`mt-1.5 ${fieldInputClass} ${!confirmed && confirmText ? fieldInputErrorClass : ""}`}
            />
          </div>

          {error && <p className={fieldErrorTextClass}>{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={status === "saving" || !confirmed}
              className="flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "saving" && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              Permanently delete
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={status === "saving"}
              className="flex min-h-11 items-center rounded-full border border-nav-lavender-line px-4 py-2.5 text-sm font-medium text-nav-plum/80 transition-colors duration-150 hover:bg-nav-lavender-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
