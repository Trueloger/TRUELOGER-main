"use client";

// src/context/AuthContext.tsx
// Real Firebase Authentication + profile layer, replacing the earlier
// placeholder (fake `login()` that just set a hardcoded name). This is
// the ONE auth listener for the whole app — every page/component reads
// auth state through `useAuth()`, never its own `onAuthStateChanged`.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "@/lib/firebase-client";
import { isProfileComplete as computeIsProfileComplete, type UserProfile } from "@/lib/profile/types";

type AuthContextValue = {
  currentUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Google sign-in/sign-up — used identically by /login and /signup
   * (there's no separate "Google signup" flow; Firebase creates the
   * account on first sign-in automatically). Tries signInWithPopup
   * first: the result comes back directly in this promise via
   * window.opener while both windows stay open, with no cross-origin
   * storage handoff involved — which matters because this project's
   * authDomain (trueloger-d4432.firebaseapp.com) is a different domain
   * from the app (trueloger.com / trueloger.vercel.app), and getRedirectResult's
   * cross-domain handoff (an iframe on the authDomain relaying the
   * result back via storage) is exactly what browser third-party
   * storage partitioning breaks — confirmed live: after a real,
   * completed Google OAuth consent, firebaseLocalStorageDb held no
   * user and sessionStorage held no pending-redirect key, so
   * getRedirectResult() had nothing to resolve. Falls back to
   * signInWithRedirect only for environments where popups genuinely
   * don't work (auth/popup-blocked, auth/operation-not-supported-in-
   * this-environment) — mobile Safari/in-app browsers. Returns which
   * path was taken so the caller knows whether to navigate immediately
   * (popup — already resolved) or wait (redirect — page is navigating
   * away). */
  signInWithGoogle: () => Promise<"popup" | "redirect">;
  /** Call once on mount of /login and /signup: resolves true if the
   * browser just returned from a Google sign-in redirect (so the
   * caller should navigate on to /profile/complete), false on a normal
   * page load with nothing to resolve. Firebase Auth itself already
   * establishes the session before this resolves (onIdTokenChanged
   * above will have already fired) — this exists purely so the
   * calling page knows WHY it's on this page again and where to send
   * the user next. */
  consumeGoogleRedirectResult: () => Promise<boolean>;
  logout: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  /** Firebase ID tokens cache custom claims for up to an hour — call
   * this right after a claim change (e.g. right after the admin
   * bootstrap script runs) to force a fresh token instead of waiting. */
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Single source of truth for auth state — fires on sign-in/out AND
  // whenever the ID token itself refreshes (which is also when a
  // custom-claim change actually becomes visible client-side).
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setIsAdmin(tokenResult.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Live profile doc — Firestore rules restrict this read to the
  // signed-in owner (or an admin), see firestore.rules.
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(
      doc(firestoreDb, "users", currentUser.uid),
      (snap) => setProfile(snap.exists() ? (snap.data() as UserProfile) : null),
      () => setProfile(null),
    );
    return unsubscribe;
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      profile,
      loading,
      isAuthenticated: !!currentUser,
      isProfileComplete: computeIsProfileComplete(profile),
      isAdmin,
      async signUp(email, password, fullName) {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
        await sendEmailVerification(cred.user);
        // The profile document itself is created by the Profile
        // Completion step (src/app/profile/complete/page.tsx via
        // PUT /api/profile), not here — signUp's only job is the
        // Firebase Auth account.
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      },
      async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
          await signInWithPopup(firebaseAuth, provider);
          return "popup";
        } catch (err) {
          const code = (err as { code?: string } | null)?.code ?? "";
          if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
            await signInWithRedirect(firebaseAuth, provider);
            return "redirect";
          }
          throw err;
        }
      },
      async consumeGoogleRedirectResult() {
        const result = await getRedirectResult(firebaseAuth);
        return result !== null;
      },
      async logout() {
        await signOut(firebaseAuth);
      },
      async sendReset(email) {
        await sendPasswordResetEmail(firebaseAuth, email);
      },
      async resendVerificationEmail() {
        if (firebaseAuth.currentUser) await sendEmailVerification(firebaseAuth.currentUser);
      },
      async refreshClaims() {
        if (firebaseAuth.currentUser) {
          const tokenResult = await firebaseAuth.currentUser.getIdTokenResult(true);
          setIsAdmin(tokenResult.claims.admin === true);
        }
      },
    }),
    [currentUser, profile, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
