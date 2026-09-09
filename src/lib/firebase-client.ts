// src/lib/firebase-client.ts
// Browser-side Firebase app (Auth + Firestore). Uses only the
// NEXT_PUBLIC_FIREBASE_* variables already present in .env.local — safe
// to bundle into client JS (these are public identifiers, not secrets;
// the actual security boundary is Firestore Security Rules + Firebase
// Auth, not hiding this config). Never import firebase-admin.ts (the
// server-only Admin SDK) from anything that also imports this file.
"use client";

import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(app);
export const firestoreDb: Firestore = getFirestore(app);
