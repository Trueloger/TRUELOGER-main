"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Placeholder auth context — this repo has no Firebase wiring yet.
 * Shape (user / login / logout) mirrors what a real Firebase auth
 * listener would provide, so swapping in `onAuthStateChanged` later
 * only touches this file, not the nav components that consume it.
 */
export type NavUser = {
  name: string;
  email: string;
  photoURL?: string | null;
};

type AuthContextValue = {
  user: NavUser | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NavUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: () =>
        setUser({ name: "Anjali Sharma", email: "anjali@example.com", photoURL: null }),
      logout: () => setUser(null),
    }),
    [user],
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
