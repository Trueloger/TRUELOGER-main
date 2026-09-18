"use client";

// src/app/login/page.tsx
// Email + password sign-in. Delegates all real auth work to
// useAuth().signIn (src/context/AuthContext.tsx) — this page only owns
// the form UI, client-side validation, and a friendly presentation of
// whatever Firebase Auth error comes back (never the raw Firebase
// error code/message, per this project's UX rule).
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LotusIcon } from "@/components/quick-services/icons";
import { fieldLabelClass, fieldInputClass } from "@/components/forms/field-styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { mapGoogleAuthError } from "@/lib/auth/google-error";

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
  const { signIn, signInWithGoogle, consumeGoogleRedirectResult, currentUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against firing router.replace twice — once from the
  // Google-redirect effect below and once from the live-auth-state
  // effect that follows it — for what is really the same navigation
  // decision.
  const hasNavigatedRef = useRef(false);

  const redirectParam = searchParams.get("redirect");
  const signupHref = redirectParam
    ? `/signup?redirect=${encodeURIComponent(redirectParam)}`
    : "/signup";

  // Always route a completed sign-in (Google OR email/password) through
  // /profile/complete rather than straight to the target — it redirects
  // on through instantly once that page's own live Firestore profile
  // listener confirms the profile is already complete, and shows the
  // completion form if not. One decision point, used by every auth
  // method, instead of email/password computing its own separate
  // "profile complete?" check here with a possibly-stale profile value.
  function profileCompleteTarget() {
    return redirectParam ? `/profile/complete?redirect=${encodeURIComponent(redirectParam)}` : "/profile/complete";
  }

  function navigateOnce() {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    router.replace(profileCompleteTarget());
  }

  // THE ACTUAL FIX for "Google auth succeeds, app still thinks I'm
  // logged out": this used to gate navigation ENTIRELY on
  // consumeGoogleRedirectResult()'s return value. That promise can
  // resolve to null even after a real, successful sign-in — Firebase
  // matches a returning redirect to its origin via a sessionStorage
  // key written before the browser ever left for Google, and that key
  // can legitimately be gone by the time the browser comes back (e.g.
  // Safari/ITP storage partitioning across the accounts.google.com hop,
  // or simply a slow network making the round trip outlast the
  // session). When that happens, the ID token itself is still valid —
  // onIdTokenChanged in AuthContext DOES fire with the real user — but
  // this page, waiting only on getRedirectResult, never notices and
  // never navigates, so the user is left staring at the login form
  // looking exactly as if the whole thing failed.
  //
  // The fix: auth STATE (currentUser/loading from AuthContext, backed
  // by Firebase's own onIdTokenChanged) is the source of truth for
  // navigation here, not the one-shot redirect-result promise. The
  // moment Firebase reports a real signed-in user, we leave — however
  // that happened to occur (Google redirect return, or simply an
  // already-authenticated user who landed on /login directly).
  useEffect(() => {
    if (loading) return; // auth state unresolved — never redirect on an unknown state
    if (currentUser) navigateOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigateOnce is a plain function (new identity each render) wrapping router.replace + a ref guard; including it would re-run this effect every render for no behavioral difference
  }, [loading, currentUser]);

  // Kept alongside the effect above purely to surface real Google
  // errors (account-exists-with-different-credential, unauthorized
  // domain, etc.) that getRedirectResult can still throw — navigation
  // itself no longer depends on what this resolves to.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await consumeGoogleRedirectResult();
      } catch (err) {
        if (cancelled) return;
        const code = (err as { code?: string } | null)?.code ?? "";
        const message = mapGoogleAuthError(code);
        if (message) setError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consumeGoogleRedirectResult]);

  function handleGoogleSignIn() {
    setError(null);
    setGoogleSubmitting(true);
    // Not awaited — signInWithRedirect navigates the browser away, it
    // doesn't resolve on this page. If it throws synchronously (rare —
    // an unsupported environment), surface that instead of leaving the
    // button stuck in a loading state forever.
    signInWithGoogle().catch((err) => {
      const code = (err as { code?: string } | null)?.code ?? "";
      const message = mapGoogleAuthError(code);
      if (message) setError(message);
      setGoogleSubmitting(false);
    });
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
      // Navigate via the same single decision point Google uses (see
      // the live-auth-state effect above) rather than computing a
      // second, independent "where does this user go" answer here —
      // the effect will also fire once `currentUser` updates, but
      // navigateOnce()'s guard means only the first call actually
      // navigates.
      navigateOnce();
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
