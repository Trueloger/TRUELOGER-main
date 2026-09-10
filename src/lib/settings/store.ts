// src/lib/settings/store.ts
// Server-only Firestore access for the two settings singletons. Never
// import from a "use client" file.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import {
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_TAX_SETTINGS,
  type DeliverySettings,
  type TaxSettings,
} from "./types";

function db() {
  return getFirestore(getAdminApp());
}

export async function getTaxSettings(): Promise<TaxSettings> {
  const snap = await db().collection("settings").doc("tax").get();
  return snap.exists ? (snap.data() as TaxSettings) : DEFAULT_TAX_SETTINGS;
}

export async function setTaxSettings(settings: Omit<TaxSettings, "updatedAt">): Promise<TaxSettings> {
  const updated: TaxSettings = { ...settings, updatedAt: Date.now() };
  await db().collection("settings").doc("tax").set(updated);
  return updated;
}

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const snap = await db().collection("settings").doc("delivery").get();
  return snap.exists ? (snap.data() as DeliverySettings) : DEFAULT_DELIVERY_SETTINGS;
}

export async function setDeliverySettings(
  settings: Omit<DeliverySettings, "updatedAt">,
): Promise<DeliverySettings> {
  const updated: DeliverySettings = { ...settings, updatedAt: Date.now() };
  await db().collection("settings").doc("delivery").set(updated);
  return updated;
}
