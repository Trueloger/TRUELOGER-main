// src/lib/services/store.ts
// Server-only Firestore access (Admin SDK) for the shared Healing/
// Puja/Course "simple service" catalogues. Mirrors
// src/lib/reports/store.ts's product half exactly: one collection
// (serviceProducts/{category}__{slug}) holding ONLY the admin-editable
// pricing fields, merged with the developer-controlled blueprint
// (./registry.ts) at read time.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { blueprintsFor, getBlueprint, docId } from "./registry";
import { computeDiscountPercent, type ServiceCategory, type ServicePricing, type ServiceProduct } from "./types";

const COLLECTION = "serviceProducts";

function db() {
  return getFirestore(getAdminApp());
}

async function ensurePricingDoc(category: ServiceCategory, slug: string): Promise<ServicePricing> {
  const ref = db().collection(COLLECTION).doc(docId(category, slug));
  const snap = await ref.get();
  if (snap.exists) return snap.data() as ServicePricing;

  const blueprint = getBlueprint(category, slug);
  if (!blueprint) throw new Error(`Unknown service ${category}/${slug}`);
  const seeded: ServicePricing = {
    mrp: blueprint.seedMrp,
    salePrice: blueprint.seedSalePrice,
    deliveryTime: blueprint.seedDeliveryTime,
    active: true,
    updatedAt: Date.now(),
  };
  await ref.set(seeded);
  return seeded;
}

function merge(blueprint: ReturnType<typeof getBlueprint>, pricing: ServicePricing): ServiceProduct | null {
  if (!blueprint) return null;
  return {
    ...blueprint,
    mrp: pricing.mrp,
    salePrice: pricing.salePrice,
    discountPercent: computeDiscountPercent(pricing.mrp, pricing.salePrice),
    deliveryTime: pricing.deliveryTime,
    active: pricing.active,
  };
}

export async function getServiceProduct(category: ServiceCategory, slug: string): Promise<ServiceProduct | null> {
  const blueprint = getBlueprint(category, slug);
  if (!blueprint) return null;
  const pricing = await ensurePricingDoc(category, slug);
  return merge(blueprint, pricing);
}

export async function listServiceProducts(category: ServiceCategory): Promise<ServiceProduct[]> {
  const blueprints = blueprintsFor(category);
  const all = await Promise.all(blueprints.map((b) => getServiceProduct(category, b.slug)));
  return all.filter((p): p is ServiceProduct => p !== null);
}

/** Admin-only write — ONLY these 4 fields are ever settable (mirrors
 * updateReportProductPricing's restriction exactly, by type signature). */
export async function updateServicePricing(
  category: ServiceCategory,
  slug: string,
  patch: Partial<Pick<ServicePricing, "mrp" | "salePrice" | "deliveryTime" | "active">>,
): Promise<ServiceProduct> {
  const blueprint = getBlueprint(category, slug);
  if (!blueprint) throw new Error(`Unknown service ${category}/${slug}`);
  await ensurePricingDoc(category, slug);
  const ref = db().collection(COLLECTION).doc(docId(category, slug));
  const current = (await ref.get()).data() as ServicePricing;
  const updated: ServicePricing = { ...current, ...patch, updatedAt: Date.now() };
  await ref.set(updated);
  const product = merge(blueprint, updated);
  if (!product) throw new Error("unreachable");
  return product;
}

export async function listAllServiceProductsForAdmin(): Promise<ServiceProduct[]> {
  const categories: ServiceCategory[] = ["healing", "puja", "course"];
  const lists = await Promise.all(categories.map((c) => listServiceProducts(c)));
  return lists.flat();
}
