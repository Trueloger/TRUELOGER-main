"use client";

// src/components/auth/AdminRoute.tsx
// Client-side guard for /admin/* pages — redirects to /admin/login
// when signed out OR when signed in but not an admin (deliberately the
// SAME redirect for both cases, mirroring verify-request.ts's
// verifyAdminRequest: a non-admin user gets no signal about whether
// admin routes exist or what would grant access). The real
// authorization boundary is each admin API route's own
// verifyAdminRequest() call plus Firestore rules' isAdmin() check —
// this component is a UX convenience only.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser || !isAdmin) {
      router.replace("/admin/login");
    }
  }, [loading, currentUser, isAdmin, router]);

  if (loading || !currentUser || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-nav-ivory">
        <p className="text-sm text-nav-plum/70">Checking admin access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
