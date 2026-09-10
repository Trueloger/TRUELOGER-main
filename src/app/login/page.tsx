"use client";

// src/app/login/page.tsx
// Email + password sign-in. Delegates all real auth work to
// useAuth().signIn (src/context/AuthContext.tsx) — this page only owns
// the form UI, client-side validation, and a friendly presentation of
// whatever Firebase Auth error comes back (never the raw Firebase
// error code/message, per this project's UX rule).
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LotusIcon } from "@/components/quick-services/icons";
import { fieldLabelClass, fieldInputClass } from "@/components/forms/field-styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { mapGoogleAuthError } from "@/lib/auth/google-error";

/** Only ever redirect to a same-origin relative path — never let a
 * `?redirect=` query param send a signed-in user off-site (open
 * redirect). `//evil.com` is rejected too since browsers treat a
 * leading `//` as protocol-relative. */
function safeRedirectPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/** Maps the Firebase Auth error codes a sign-in attempt can realistically
 * throw to plain-English copy. Never surfaces `error.code`/`error.message`
 * verbatim to the user. */
function mapSignInError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please check your details and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment before trying again.";
    case "auth/network-request-failed":
      return "Network error — please check your connection and try again.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    default:
      return "We couldn't sign you in. Please try again.";
  }
}

function LoadingShell() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4">
      <p className="text-sm text-nav-plum/70">Loading…</p>
    </main>
  );
}

function LoginForm() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectParam = searchParams.get("redirect");
  const signupHref = redirectParam
    ? `/signup?redirect=${encodeURIComponent(redirectParam)}`
    : "/signup";

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      // Always route through /profile/complete rather than straight to
      // the target — it redirects on through instantly if this Google
      // account already has a complete profile from an earlier
      // session, and shows the completion form if not (e.g. brand-new
      // Google sign-up), exactly like the email/password signup flow.
      const target = redirectParam
        ? `/profile/complete?redirect=${encodeURIComponent(redirectParam)}`
        : "/profile/complete";
      router.replace(target);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? "";
      const message = mapGoogleAuthError(code);
      if (message) setError(message);
      setGoogleSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(trimmedEmail, password);
      const target = safeRedirectPath(redirectParam) ?? "/account/profile";
      router.replace(target);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? "";
      setError(mapSignInError(code));
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
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-sm text-nav-plum/70">
            Log in to continue your journey with TRUELOGER.
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
              <label htmlFor="login-email" className={fieldLabelClass}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
                className={`mt-1.5 ${fieldInputClass}`}
              />
            </div>

            <div>
              <label htmlFor="login-password" className={fieldLabelClass}>
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-nav-amethyst-deep hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Log In"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-nav-lavender-line" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wide text-nav-plum/50">or</span>
            <span className="h-px flex-1 bg-nav-lavender-line" aria-hidden="true" />
          </div>

          <div className="mt-6">
            <GoogleSignInButton onClick={handleGoogleSignIn} disabled={googleSubmitting} />
          </div>

          <p className="mt-6 text-center text-sm text-nav-plum/70">
            Don&apos;t have an account?{" "}
            <Link href={signupHref} className="font-medium text-nav-amethyst-deep hover:underline">
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <LoginForm />
    </Suspense>
  );
}
