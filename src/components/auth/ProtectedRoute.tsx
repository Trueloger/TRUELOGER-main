"use client";

// src/components/auth/ProtectedRoute.tsx
// Client-side route guard for the account pages (Profile/Orders/
// Reports/Meetings/Account Settings). Redirects to /login?redirect=<path>
// when signed out, and (optionally) to the profile-completion page
// when the profile is incomplete — the ONE place this redirect logic
// lives, so every protected page behaves identically. This is a UX
// convenience layer only: the real authorization boundary is each API
// route's own verifyRequest() call (see src/lib/auth/verify-request.ts)
// and Firestore Security Rules — a client-side redirect can't be the
// actual security control, since a user could disable JS.
//
// Guards against an infinite redirect loop by only redirecting ONCE
// `loading` has settled — redirecting while auth state is still
// resolving would bounce a genuinely signed-in user to /login on every
// hard refresh.
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({
  children,
  requireCompleteProfile = false,
}: {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
}) {
  const { currentUser, loading, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requireCompleteProfile && !isProfileComplete) {
      router.replace(`/profile/complete?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, currentUser, isProfileComplete, requireCompleteProfile, pathname, router]);

  if (loading || !currentUser || (requireCompleteProfile && !isProfileComplete)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-nav-plum/70">Loading your account…</p>
      </div>
    );
  }

  return <>{children}</>;
}
