// src/lib/products/store.ts
// Server-only Firestore access for the `products` top-level collection
// (Admin SDK — bypasses Security Rules; every function here must only
// be called from a route that has already checked auth/role itself,
// same convention as src/lib/orders/store.ts). Never import from a
// "use client" file.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { Product, ProductCategory, ProductStatus } from "./types";

const COLLECTION = "products";

function db() {
  return getFirestore(getAdminApp());
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as Product) : null;
}

/** Slug === id for every product this system creates (see
 * createProduct), so this is just getProductById by another name —
 * kept as its own function so callers reading by slug (storefront
 * routes) don't need to know that equivalence is an implementation
 * detail rather than a guarantee. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await db().collection(COLLECTION).where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as Product;
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const product = await getProductBySlug(slug);
  return product && product.status === "published" ? product : null;
}

/** Storefront listing — published only, optionally filtered by
 * category. No pagination here (the current catalogue is small enough
 * — dozens, not thousands — that a single bounded query is fine; see
 * listProductsForAdmin for the paginated version admin uses once the
 * catalogue is large). Sorted by name in-memory rather than via
 * `orderBy` so this never depends on a Firestore composite index
 * (equality-only filters need no composite index; adding `orderBy` on
 * a third field would) — fine at this catalogue size. */
export async function listPublishedProducts(category?: ProductCategory): Promise<Product[]> {
  let query = db().collection(COLLECTION).where("status", "==", "published");
  if (category) {
    query = query.where("category", "==", category);
  }
  const snap = await query.get();
  return snap.docs.map((d) => d.data() as Product).sort((a, b) => a.name.localeCompare(b.name));
}

export type AdminProductsPage = { products: Product[]; nextCursor: string | null };

export async function listProductsForAdmin(options: {
  category?: ProductCategory;
  status?: ProductStatus;
  limit?: number;
  cursorId?: string;
}): Promise<AdminProductsPage> {
  const limit = options.limit ?? 25;
  let query = db().collection(COLLECTION).orderBy("updatedAt", "desc").limit(limit);
  if (options.category) {
    query = db()
      .collection(COLLECTION)
      .where("category", "==", options.category)
      .orderBy("updatedAt", "desc")
      .limit(limit) as typeof query;
  }
  if (options.status) {
    query = db()
      .collection(COLLECTION)
      .where("status", "==", options.status)
      .orderBy("updatedAt", "desc")
      .limit(limit) as typeof query;
  }
  if (options.cursorId) {
    const cursorSnap = await db().collection(COLLECTION).doc(options.cursorId).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }
  const snap = await query.get();
  const products = snap.docs.map((d) => d.data() as Product);
  const nextCursor = products.length === limit ? products[products.length - 1].id : null;
  return { products, nextCursor };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Ensures a unique slug by suffixing -2, -3, ... if the naive slug
 * collides with an existing product — a real, if unglamorous, way to
 * satisfy "avoid duplicate slugs" without requiring the admin to think
 * about it. */
async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "product";
  let n = 2;
  while (await getProductBySlug(candidate)) {
    candidate = `${base}-${n}`;
    n++;
  }
  return candidate;
}

export async function createProduct(
  input: Omit<Product, "id" | "slug" | "createdAt" | "updatedAt"> & { slug?: string },
): Promise<Product> {
  const now = Date.now();
  const baseSlug = slugify(input.slug || input.name);
  const slug = await uniqueSlug(baseSlug);
  const id = slug;
  const product: Product = { ...input, id, slug, createdAt: now, updatedAt: now };
  await db().collection(COLLECTION).doc(id).set(product);
  return product;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
  const ref = db().collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;
  const safePatch = { ...patch };
  delete (safePatch as Partial<Product>).id;
  delete (safePatch as Partial<Product>).createdAt;
  const updated = { ...(existing.data() as Product), ...safePatch, updatedAt: Date.now() };
  await ref.set(updated);
  return updated;
}

/** True if any order references this product — used to decide whether
 * a delete request must be downgraded to an archive instead (see
 * "product deletion safety": never destroy a product historical orders
 * depend on, since order line items reference productId even though
 * they also carry their own price snapshot independent of it). */
export async function productHasOrders(productId: string): Promise<boolean> {
  // Firestore has no query operator that reaches into an array of
  // OBJECTS to match one field (array-contains-any only matches
  // scalar array elements) — so this scans the orders collection's
  // `items` field directly. Fine at this catalogue/order-volume scale;
  // if the orders collection grows very large, a denormalized
  // `productIds: string[]` field on each order (populated at create
  // time) would let this become a real `array-contains` query instead.
  const snap = await db().collection("orders").select("items").get();
  return snap.docs.some((doc) => {
    const items = (doc.data().items as { productId?: string }[]) ?? [];
    return items.some((item) => item.productId === productId);
  });
}

/** Deletes a product ONLY if it has never been ordered; otherwise
 * archives it instead and returns "archived" so the caller can inform
 * the admin why a hard delete didn't happen. */
export async function deleteOrArchiveProduct(id: string): Promise<"deleted" | "archived" | "not_found"> {
  const existing = await getProductById(id);
  if (!existing) return "not_found";
  const hasOrders = await productHasOrders(id);
  if (hasOrders) {
    await updateProduct(id, { status: "archived" });
    return "archived";
  }
  await db().collection(COLLECTION).doc(id).delete();
  return "deleted";
}
