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
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  /** Google sign-in/sign-up via a popup — used identically by /login
   * and /signup (there's no separate "Google signup" flow; Firebase
   * creates the account on first sign-in automatically). Like
   * email/password signUp, this never touches the Firestore profile
   * doc itself — the caller always routes through /profile/complete
   * afterward, which redirects straight through if the profile (from
   * an earlier session) is already complete. */
  signInWithGoogle: () => Promise<void>;
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
        await signInWithPopup(firebaseAuth, provider);
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
