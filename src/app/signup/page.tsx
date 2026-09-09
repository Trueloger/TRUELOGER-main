"use client";

// src/app/signup/page.tsx
// Full name + email + password (+ confirm) + optional mobile number.
// Delegates the actual Firebase Auth account creation to
// useAuth().signUp (src/context/AuthContext.tsx) — that call sets the
// displayName and sends a verification email but deliberately does NOT
// create the Firestore profile doc, so signup always continues into
// /profile/complete rather than dropping a user into the app with an
// empty profile.
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LotusIcon } from "@/components/quick-services/icons";
import { fieldLabelClass, fieldInputClass } from "@/components/forms/field-styles";

/** sessionStorage key the mobile number entered here is stashed under so
 * /profile/complete (the very next step) can pre-fill it — signUp()
 * itself has no phone parameter, and this is a transient hand-off, not
 * data worth putting in the URL. Read once and cleared by that page. */
export const SIGNUP_PHONE_HANDOFF_KEY = "trueloger:signup-phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maps the Firebase Auth error codes a sign-up attempt can realistically
 * throw to plain-English copy. Never surfaces `error.code`/`error.message`
 * verbatim to the user. */
function mapSignUpError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists — try logging in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/network-request-failed":
      return "Network error — please check your connection and try again.";
    default:
      return "We couldn't create your account. Please try again.";
  }
}

function LoadingShell() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4">
      <p className="text-sm text-nav-plum/70">Loading…</p>
    </main>
  );
}

function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectParam = searchParams.get("redirect");
  const loginHref = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Enter your full name.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp(trimmedEmail, password, trimmedName);

      const trimmedPhone = phone.trim();
      if (trimmedPhone) {
        try {
          sessionStorage.setItem(SIGNUP_PHONE_HANDOFF_KEY, trimmedPhone);
        } catch {
          // sessionStorage can throw in locked-down browser contexts —
          // losing the phone pre-fill is harmless, it's optional anyway.
        }
      }

      const target = redirectParam
        ? `/profile/complete?redirect=${encodeURIComponent(redirectParam)}`
        : "/profile/complete";
      router.replace(target);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? "";
      setError(mapSignUpError(code));
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-md">
        <section className="relative overflow-hidden rounded-2xl border border-nav-lavender-line bg-nav-pearl px-5 py-8 shadow-[0_18px_40px_-18px_rgba(70,40,120,0.35)] sm:px-8 sm:py-10 md:rounded-3xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>

          <h1 className="mt-4 text-center font-serif text-[1.75rem] leading-tight text-nav-violet sm:text-3xl">
            Create Your Account
          </h1>
          <p className="mt-2 text-center text-sm text-nav-plum/70">
            Join TRUELOGER to save your birth details and unlock every astrology tool.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="signup-name" className={fieldLabelClass}>
                Full Name <span className="text-nav-amethyst-deep">*</span>
              </label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                maxLength={80}
                autoComplete="name"
                autoFocus
                className={`mt-1.5 ${fieldInputClass}`}
              />
            </div>

            <div>
              <label htmlFor="signup-email" className={fieldLabelClass}>
                Email <span className="text-nav-amethyst-deep">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={`mt-1.5 ${fieldInputClass}`}
              />
            </div>

            <div>
              <label htmlFor="signup-phone" className={fieldLabelClass}>
                Mobile Number{" "}
                <span className="text-xs font-normal text-nav-plum/50">(optional)</span>
              </label>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                maxLength={20}
                autoComplete="tel"
                className={`mt-1.5 ${fieldInputClass}`}
              />
            </div>

            <div>
              <label htmlFor="signup-password" className={fieldLabelClass}>
                Password <span className="text-nav-amethyst-deep">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={`${fieldInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-nav-plum/60 transition-colors duration-150 hover:text-nav-amethyst"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className={fieldLabelClass}>
                Confirm Password <span className="text-nav-amethyst-deep">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  className={`${fieldInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-nav-plum/60 transition-colors duration-150 hover:text-nav-amethyst"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-nav-plum/70">
            Already have an account?{" "}
            <Link href={loginHref} className="font-medium text-nav-amethyst-deep hover:underline">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <SignupForm />
    </Suspense>
  );
}
