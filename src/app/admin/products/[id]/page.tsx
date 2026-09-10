"use client";

// src/app/admin/products/[id]/page.tsx
// Add/edit form for a single product. `id === "new"` creates (POST);
// any other id loads and edits that product (PATCH). Category is
// LOCKED once a product exists — changing category on an existing
// product would be confusing given category-specific variant-id
// conventions (a gemstone's variant id is a Ratti number, a
// Rudraksha's a Mukhi count; re-interpreting existing variant ids
// under a new category's convention has no sane migration), so the
// picker is only enabled while creating.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authedFetch } from "@/lib/auth/authed-fetch";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
  type ProductFaq,
  type ProductStatus,
} from "@/lib/products/types";
import { VariantEditor, emptyVariantRow, type VariantRow } from "@/components/admin/products/VariantEditor";
import { GalleryEditor, emptyGallery, GALLERY_ROLE_ORDER, type GalleryRow } from "@/components/admin/products/GalleryEditor";
import { AttributesEditor, emptyAttributesForm, type AttributesForm } from "@/components/admin/products/AttributesEditor";
import { FaqEditor } from "@/components/admin/products/FaqEditor";
import { INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "@/components/admin/products/form-styles";

const STATUSES: ProductStatus[] = ["published", "draft", "archived"];

type FormState = {
  category: ProductCategory | "";
  name: string;
  slug: string;
  slugTouched: boolean;
  shortDescription: string;
  description: string;
  status: ProductStatus;
  imageAlt: string;
  imageSrc: string;
  gallery: GalleryRow[];
  variants: VariantRow[];
  defaultVariantId: string;
  attributes: AttributesForm;
  faqs: ProductFaq[];
  certificationInfo: string;
  deliveryEstimate: string;
  lowStockThreshold: string;
  seoTitle: string;
  seoDescription: string;
};

function emptyForm(): FormState {
  return {
    category: "",
    name: "",
    slug: "",
    slugTouched: false,
    shortDescription: "",
    description: "",
    status: "draft",
    imageAlt: "",
    imageSrc: "",
    gallery: emptyGallery(""),
    variants: [emptyVariantRow()],
    defaultVariantId: "",
    attributes: emptyAttributesForm(),
    faqs: [],
    certificationInfo: "",
    deliveryEstimate: "",
    lowStockThreshold: "",
    seoTitle: "",
    seoDescription: "",
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function productToForm(product: Product): FormState {
  return {
    category: product.category,
    name: product.name,
    slug: product.slug,
    slugTouched: true,
    shortDescription: product.shortDescription,
    description: product.description,
    status: product.status,
    imageAlt: product.image.alt ?? "",
    imageSrc: product.image.src ?? "",
    gallery: GALLERY_ROLE_ORDER.map((role) => {
      const slot = product.gallery.find((g) => g.role === role);
      return { role, label: slot?.label ?? "", src: slot?.src ?? "" };
    }),
    variants: product.variants.map((v) => ({
      id: v.id,
      label: v.label,
      ratti: v.ratti !== undefined ? String(v.ratti) : "",
      mrp: String(v.mrp),
      salePrice: String(v.salePrice),
      inStock: v.inStock !== false,
    })),
    defaultVariantId: product.defaultVariantId,
    attributes: {
      alternateName: product.attributes.alternateName ?? "",
      rulingPlanet: product.attributes.rulingPlanet ?? "",
      associatedDeity: product.attributes.associatedDeity ?? "",
      associatedDay: product.attributes.associatedDay ?? "",
      associatedMetal: product.attributes.associatedMetal ?? "",
      wearingFinger: product.attributes.wearingFinger ?? "",
      wearingMethod: product.attributes.wearingMethod ?? "",
      mantra: product.attributes.mantra ?? "",
      material: product.attributes.material ?? "",
      origin: product.attributes.origin ?? "",
      size: product.attributes.size ?? "",
      astrologicalSignificance: product.attributes.astrologicalSignificance ?? "",
      benefits: (product.attributes.benefits ?? []).join("\n"),
      careInstructions: (product.attributes.careInstructions ?? []).join("\n"),
      suitableFor: (product.attributes.suitableFor ?? []).join("\n"),
    },
    faqs: product.faqs,
    certificationInfo: product.certificationInfo ?? "",
    deliveryEstimate: product.deliveryEstimate ?? "",
    lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : "",
    seoTitle: product.seo.title,
    seoDescription: product.seo.description,
  };
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

export default function AdminProductFormPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const isNew = id === "new";

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loadState, setLoadState] = useState<LoadState>({ status: isNew ? "ready" : "loading" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoadState({ status: "loading" });
    try {
      const res = await authedFetch(`/api/admin/products/${id}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { product: Product };
      setForm(productToForm(data.product));
      setLoadState({ status: "ready" });
    } catch {
      setLoadState({ status: "error", message: "We couldn't load this product." });
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) {
      queueMicrotask(() => loadProduct());
    }
  }, [isNew, loadProduct]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slugTouched ? prev.slug : slugify(name),
    }));
  }

  function handleSlugChange(slug: string) {
    setForm((prev) => ({ ...prev, slug, slugTouched: true }));
  }

  const clientError = useMemo(() => validateForm(form), [form]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (clientError) {
      setSaveError(clientError);
      return;
    }

    const payload = buildPayload(form);
    setSaving(true);
    try {
      const res = await authedFetch(isNew ? "/api/admin/products" : `/api/admin/products/${id}`, {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !data.product) {
        setSaveError(data.error ?? "Something went wrong saving this product.");
        return;
      }
      router.push("/admin/products");
    } catch {
      setSaveError("Something went wrong saving this product. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState.status === "loading") {
    return (
      <div className="mx-auto max-w-4xl">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
        >
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading product…</p>
        </div>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="mx-auto max-w-4xl">
        <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {loadState.message}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl break-words">{isNew ? "Add Product" : `Edit: ${form.name || "Product"}`}</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">{isNew ? "Create a new catalogue product." : "Update this product's details."}</p>
        </div>
        <Link href="/admin/products" className="shrink-0 text-sm font-medium text-nav-amethyst-deep hover:underline">
          Back to list
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {saveError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {saveError}
          </div>
        )}

        {/* Core details */}
        <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
          <h2 className="font-serif text-lg text-nav-violet">Details</h2>

          <div className="mt-3">
            <span className={LABEL_CLASS}>Category</span>
            {isNew ? (
              <div className="flex flex-wrap gap-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("category", cat)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                      form.category === cat
                        ? "bg-nav-amethyst text-white"
                        : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line hover:bg-nav-lavender-mist"
                    }`}
                  >
                    {PRODUCT_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-nav-lavender-line bg-nav-lavender-mist px-3 py-2 text-sm text-nav-plum/80">
                {form.category ? PRODUCT_CATEGORY_LABELS[form.category] : "—"}{" "}
                <span className="text-xs text-nav-plum/60">(locked once created)</span>
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={LABEL_CLASS}>Name</span>
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={INPUT_CLASS} required />
            </div>
            <div>
              <span className={LABEL_CLASS}>Slug</span>
              <input value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} className={INPUT_CLASS} placeholder="auto-suggested from name" />
            </div>
          </div>

          <div className="mt-3">
            <span className={LABEL_CLASS}>Status</span>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 ${
                    form.status === s ? "bg-nav-violet text-white" : "bg-nav-lavender-mist text-nav-plum/70 hover:text-nav-violet"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <span className={LABEL_CLASS}>Short description</span>
            <input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={INPUT_CLASS} />
          </div>

          <div className="mt-3">
            <span className={LABEL_CLASS}>Description</span>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={TEXTAREA_CLASS} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={LABEL_CLASS}>Primary image alt text</span>
              <input value={form.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <span className={LABEL_CLASS}>Primary image URL</span>
              <input value={form.imageSrc} onChange={(e) => set("imageSrc", e.target.value)} placeholder="https://…" className={INPUT_CLASS} />
            </div>
          </div>
        </div>

        <VariantEditor
          category={form.category}
          variants={form.variants}
          defaultVariantId={form.defaultVariantId}
          onChange={(variants) => set("variants", variants)}
          onDefaultVariantChange={(defaultVariantId) => set("defaultVariantId", defaultVariantId)}
        />

        <GalleryEditor gallery={form.gallery} onChange={(gallery) => set("gallery", gallery)} />

        <AttributesEditor attributes={form.attributes} onChange={(attributes) => set("attributes", attributes)} />

        <FaqEditor faqs={form.faqs} onChange={(faqs) => set("faqs", faqs)} />

        {/* Extra details */}
        <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
          <h2 className="font-serif text-lg text-nav-violet">Additional details</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={LABEL_CLASS}>Certification info</span>
              <input value={form.certificationInfo} onChange={(e) => set("certificationInfo", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <span className={LABEL_CLASS}>Delivery estimate override</span>
              <input value={form.deliveryEstimate} onChange={(e) => set("deliveryEstimate", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <span className={LABEL_CLASS}>Low stock threshold</span>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
          <h2 className="font-serif text-lg text-nav-violet">SEO</h2>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <span className={LABEL_CLASS}>SEO title</span>
              <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <span className={LABEL_CLASS}>SEO description</span>
              <textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={TEXTAREA_CLASS} />
            </div>
          </div>
        </div>

        {clientError && <p className="text-sm text-rose-700">{clientError}</p>}

        <div className="flex justify-end gap-2">
          <Link
            href="/admin/products"
            className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-5 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function validateForm(form: FormState): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (!form.category) return "Category is required.";
  if (form.variants.length === 0) return "At least one variant is required.";
  for (const v of form.variants) {
    if (!v.id.trim()) return "Every variant needs an id.";
    if (!v.label.trim()) return "Every variant needs a label.";
    const mrp = Number(v.mrp);
    const salePrice = Number(v.salePrice);
    if (!Number.isFinite(mrp) || mrp <= 0) return `Variant "${v.id}" needs a valid MRP.`;
    if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice > mrp) {
      return `Variant "${v.id}"'s sale price must be positive and no greater than MRP.`;
    }
  }
  const ids = form.variants.map((v) => v.id.trim());
  if (new Set(ids).size !== ids.length) return "Variant ids must be unique.";
  if (!form.defaultVariantId || !ids.includes(form.defaultVariantId)) {
    return "Pick a default variant that matches one of the variants entered.";
  }
  return null;
}

function buildPayload(form: FormState) {
  const attributes: Record<string, unknown> = {};
  const attrTextKeys: (keyof AttributesForm)[] = [
    "alternateName",
    "rulingPlanet",
    "associatedDeity",
    "associatedDay",
    "associatedMetal",
    "wearingFinger",
    "wearingMethod",
    "mantra",
    "material",
    "origin",
    "size",
    "astrologicalSignificance",
  ];
  for (const key of attrTextKeys) {
    const value = form.attributes[key].trim();
    if (value) attributes[key] = value;
  }
  const benefits = linesToArray(form.attributes.benefits);
  const careInstructions = linesToArray(form.attributes.careInstructions);
  const suitableFor = linesToArray(form.attributes.suitableFor);
  if (benefits.length) attributes.benefits = benefits;
  if (careInstructions.length) attributes.careInstructions = careInstructions;
  if (suitableFor.length) attributes.suitableFor = suitableFor;

  const lowStockThreshold = form.lowStockThreshold.trim() ? Number(form.lowStockThreshold) : undefined;

  return {
    slug: form.slug.trim() || undefined,
    name: form.name.trim(),
    category: form.category,
    status: form.status,
    shortDescription: form.shortDescription,
    description: form.description,
    image: { alt: form.imageAlt || `${form.name} — placeholder`, src: form.imageSrc || undefined },
    gallery: form.gallery.map((g) => ({ role: g.role, label: g.label, src: g.src || undefined })),
    variants: form.variants.map((v) => ({
      id: v.id.trim(),
      label: v.label.trim(),
      ratti: form.category === "gemstone" && v.ratti.trim() ? Number(v.ratti) : undefined,
      mrp: Number(v.mrp),
      salePrice: Number(v.salePrice),
      inStock: v.inStock,
    })),
    defaultVariantId: form.defaultVariantId,
    attributes,
    faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    certificationInfo: form.certificationInfo.trim() || undefined,
    deliveryEstimate: form.deliveryEstimate.trim() || undefined,
    lowStockThreshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : undefined,
    seo: {
      title: form.seoTitle.trim() || `${form.name} | TRUELOGER`,
      description: form.seoDescription.trim() || form.shortDescription,
    },
  };
}
