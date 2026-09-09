"use client";

// src/app/admin/login/page.tsx
// Admin sign-in — mechanically identical to the customer login page
// (same useAuth().signIn(email, password); there is no separate
// "admin login" mechanism in Firebase), but its own copy/heading and
// its own post-login check: sign-in can succeed for ANY account, so
// after a successful signIn() we check isAdmin and only then redirect
// into /admin. A non-admin account that signs in successfully here
// sees a clear "no admin access" message instead of a silent bounce
// (the AdminRoute guard on every other /admin/* page would redirect
// them straight back here anyway, but this is a better UX).
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { firebaseAuth } from "@/lib/firebase-client";

function mapAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error — please check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function AdminLoginPage() {
  const { signIn, isAdmin, currentUser, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notAdmin, setNotAdmin] = useState(false);

  // If an already-signed-in admin lands on this page directly, send
  // them straight to the dashboard rather than showing the form again.
  useEffect(() => {
    if (!loading && currentUser && isAdmin) {
      router.replace("/admin");
    }
  }, [loading, currentUser, isAdmin, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotAdmin(false);
    try {
      await signIn(email, password);
      // isAdmin flips only once onIdTokenChanged fires with the fresh
      // token — signIn() itself resolves before that necessarily
      // lands, so re-check via a fresh token read rather than the
      // (possibly stale) isAdmin from this render.
      const user = firebaseAuth.currentUser;
      const tokenResult = await user?.getIdTokenResult();
      if (tokenResult?.claims.admin === true) {
        router.replace("/admin");
      } else {
        setNotAdmin(true);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(mapAuthError(code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-nav-lavender-line bg-nav-pearl p-6 shadow-[0_18px_40px_-20px_rgba(70,40,120,0.35)] sm:p-8">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center rounded-full bg-nav-amethyst/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-nav-amethyst-deep ring-1 ring-nav-amethyst/20">
            Admin
          </span>
          <h1 className="mt-3 font-serif text-2xl text-nav-violet">Admin Login</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">Sign in with your TRUELOGER account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium text-nav-plum/80">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium text-nav-plum/80">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
          {notAdmin && (
            <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              This account does not have admin access.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-nav-plum/70">
          <Link href="/forgot-password" className="font-medium text-nav-amethyst-deep hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
}
