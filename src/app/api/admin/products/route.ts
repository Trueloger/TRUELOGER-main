// src/app/api/admin/products/route.ts
// Admin-only product listing (paginated, any status/category) + create.
// Every request verified via verifyAdminRequest — same 404-for-everyone-
// non-admin convention as the rest of the admin API (see
// src/lib/auth/verify-request.ts's doc comment on why).
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { createProduct, listProductsForAdmin } from "@/lib/products/store";
import { PRODUCT_CATEGORIES, type Product, type ProductCategory, type ProductStatus } from "@/lib/products/types";

const STATUSES: ProductStatus[] = ["published", "draft", "archived"];

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category");
  const statusParam = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const page = await listProductsForAdmin({
    category: categoryParam && PRODUCT_CATEGORIES.includes(categoryParam as ProductCategory) ? (categoryParam as ProductCategory) : undefined,
    status: statusParam && STATUSES.includes(statusParam as ProductStatus) ? (statusParam as ProductStatus) : undefined,
    cursorId: cursor,
  });
  return NextResponse.json(page);
}

function validateProductInput(body: unknown): { ok: true; input: Omit<Product, "id" | "slug" | "createdAt" | "updatedAt"> & { slug?: string } } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid product data." };
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) return { ok: false, error: "Product name is required." };
  if (typeof b.category !== "string" || !PRODUCT_CATEGORIES.includes(b.category as ProductCategory)) {
    return { ok: false, error: "Invalid category." };
  }
  if (!Array.isArray(b.variants) || b.variants.length === 0) {
    return { ok: false, error: "At least one variant is required." };
  }
  for (const v of b.variants as Record<string, unknown>[]) {
    if (typeof v.id !== "string" || !v.id.trim()) return { ok: false, error: "Every variant needs an id." };
    if (typeof v.label !== "string" || !v.label.trim()) return { ok: false, error: "Every variant needs a label." };
    if (typeof v.mrp !== "number" || v.mrp <= 0) return { ok: false, error: "Every variant needs a valid MRP." };
    if (typeof v.salePrice !== "number" || v.salePrice <= 0 || v.salePrice > v.mrp) {
      return { ok: false, error: "Sale price must be a positive number no greater than MRP." };
    }
  }
  const defaultVariantId = typeof b.defaultVariantId === "string" ? b.defaultVariantId : (b.variants as { id: string }[])[0].id;
  if (!(b.variants as { id: string }[]).some((v) => v.id === defaultVariantId)) {
    return { ok: false, error: "defaultVariantId must match one of the variants." };
  }

  const gallery = Array.isArray(b.gallery) && b.gallery.length === 5 ? b.gallery : [
    { role: "main", label: `${b.name} — main product view` },
    { role: "angle", label: `${b.name} — alternate angle` },
    { role: "closeup", label: `${b.name} — close-up detail` },
    { role: "detail", label: `${b.name} — certificate / product detail` },
    { role: "lifestyle", label: `${b.name} — worn / lifestyle setting` },
  ];

  return {
    ok: true,
    input: {
      slug: typeof b.slug === "string" ? b.slug : undefined,
      name: (b.name as string).trim(),
      category: b.category as Product["category"],
      status: STATUSES.includes(b.status as ProductStatus) ? (b.status as ProductStatus) : "draft",
      shortDescription: typeof b.shortDescription === "string" ? b.shortDescription : "",
      description: typeof b.description === "string" ? b.description : "",
      image: (b.image as Product["image"]) ?? { alt: `${b.name} — placeholder` },
      gallery: gallery as Product["gallery"],
      variants: b.variants as Product["variants"],
      defaultVariantId,
      attributes: (b.attributes as Product["attributes"]) ?? {},
      faqs: Array.isArray(b.faqs) ? (b.faqs as Product["faqs"]) : [],
      certificationInfo: typeof b.certificationInfo === "string" ? b.certificationInfo : undefined,
      deliveryEstimate: typeof b.deliveryEstimate === "string" ? b.deliveryEstimate : undefined,
      lowStockThreshold: typeof b.lowStockThreshold === "number" ? b.lowStockThreshold : undefined,
      seo: (b.seo as Product["seo"]) ?? { title: `${b.name} | TRUELOGER`, description: (b.shortDescription as string) ?? "" },
    },
  };
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validated = validateProductInput(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  const product = await createProduct(validated.input);
  return NextResponse.json({ product });
}
