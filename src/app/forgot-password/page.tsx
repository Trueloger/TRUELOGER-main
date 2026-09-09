"use client";

// src/app/forgot-password/page.tsx
// Password reset request. Always shows the same confirmation copy
// regardless of whether the email actually belongs to an account —
// revealing that would be a real privacy leak, and Firebase's own
// sendPasswordResetEmail doesn't leak it either. The ONE exception is a
// genuine client-side problem (an invalid email address, or a network
// failure) — those get their own honest message instead of the success
// state, since they're not privacy-sensitive.
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LotusIcon } from "@/components/quick-services/icons";
import { fieldLabelClass, fieldInputClass } from "@/components/forms/field-styles";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_MESSAGE =
  "If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder) in a few minutes.";

export default function ForgotPasswordPage() {
  const { sendReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await sendReset(trimmedEmail);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? "";
      // A genuine client/network problem is worth surfacing honestly.
      // Anything else — including auth/user-not-found — must NOT be
      // distinguished from success, so it falls through to the same
      // confirmation state below.
      if (code === "auth/network-request-failed") {
        setSubmitting(false);
        setError("Network error — please check your connection and try again.");
        return;
      }
    }

    setSubmitting(false);
    setSent(true);
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
            Reset Your Password
          </h1>

          {sent ? (
            <>
              <p
                role="status"
                className="mt-4 rounded-xl border border-nav-lavender-line bg-nav-lavender-mist px-4 py-3 text-center text-sm text-nav-plum"
              >
                {SUCCESS_MESSAGE}
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-sm font-medium text-nav-amethyst-deep hover:underline"
                >
                  Send another link
                </button>
                <Link
                  href="/login"
                  className="text-sm font-medium text-nav-amethyst-deep hover:underline"
                >
                  Back to Log In
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-center text-sm text-nav-plum/70">
                Enter the email associated with your account and we&apos;ll send you a link to
                reset your password.
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
                  <label htmlFor="forgot-email" className={fieldLabelClass}>
                    Email
                  </label>
                  <input
                    id="forgot-email"
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-nav-plum/70">
                Remembered your password?{" "}
                <Link href="/login" className="font-medium text-nav-amethyst-deep hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
