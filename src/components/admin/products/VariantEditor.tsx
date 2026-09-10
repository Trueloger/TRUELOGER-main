"use client";

// src/components/admin/products/VariantEditor.tsx
// Add/edit/remove rows for Product.variants — one shape for every
// category per the "one product system, not five" design note in
// src/lib/products/types.ts. `ratti` is only shown for the "gemstone"
// category, matching the type's own doc comment that it's omitted for
// every other category. Numeric fields are kept as strings while being
// edited so the input can be temporarily empty/invalid mid-typing; the
// parent page converts to numbers and validates on save.
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import type { ProductCategory } from "@/lib/products/types";
import { INPUT_CLASS, LABEL_CLASS } from "./form-styles";

export type VariantRow = {
  id: string;
  label: string;
  ratti: string;
  mrp: string;
  salePrice: string;
  inStock: boolean;
};

export function emptyVariantRow(): VariantRow {
  return { id: "", label: "", ratti: "", mrp: "", salePrice: "", inStock: true };
}

export function VariantEditor({
  category,
  variants,
  defaultVariantId,
  onChange,
  onDefaultVariantChange,
}: {
  category: ProductCategory | "";
  variants: VariantRow[];
  defaultVariantId: string;
  onChange: (variants: VariantRow[]) => void;
  onDefaultVariantChange: (id: string) => void;
}) {
  function updateRow(index: number, patch: Partial<VariantRow>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeRow(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...variants, emptyVariantRow()]);
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg text-nav-violet">Variants</h2>
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-nav-lavender-line bg-white px-3 py-1.5 text-xs font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          + Add variant
        </button>
      </div>
      <p className="mt-1 text-xs text-nav-plum/60">
        At least one variant is required. Pick one below as the default shown to customers first.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {variants.map((variant, index) => (
          <div key={index} className="rounded-xl border border-nav-lavender-line bg-nav-pearl/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-nav-plum/80">
                <input
                  type="radio"
                  name="defaultVariant"
                  checked={variant.id.length > 0 && variant.id === defaultVariantId}
                  onChange={() => variant.id && onDefaultVariantChange(variant.id)}
                  disabled={!variant.id}
                  className="h-4 w-4 accent-[var(--color-nav-amethyst)]"
                />
                Default variant
              </label>
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={variants.length <= 1}
                aria-label="Remove variant"
                className="rounded-full p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
              <Field label="ID">
                <input
                  value={variant.id}
                  onChange={(e) => updateRow(index, { id: e.target.value })}
                  placeholder="5"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Label" className="col-span-2 sm:col-span-2">
                <input
                  value={variant.label}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  placeholder="5 Ratti"
                  className={INPUT_CLASS}
                />
              </Field>
              {category === "gemstone" && (
                <Field label="Ratti">
                  <input
                    type="number"
                    step="0.1"
                    value={variant.ratti}
                    onChange={(e) => updateRow(index, { ratti: e.target.value })}
                    placeholder="5"
                    className={INPUT_CLASS}
                  />
                </Field>
              )}
              <Field label="MRP (₹)">
                <input
                  type="number"
                  min="0"
                  value={variant.mrp}
                  onChange={(e) => updateRow(index, { mrp: e.target.value })}
                  placeholder="5000"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Sale price (₹)">
                <input
                  type="number"
                  min="0"
                  value={variant.salePrice}
                  onChange={(e) => updateRow(index, { salePrice: e.target.value })}
                  placeholder="3999"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="In stock">
                <label className="flex h-9 items-center gap-2 text-sm text-nav-plum/80">
                  <input
                    type="checkbox"
                    checked={variant.inStock}
                    onChange={(e) => updateRow(index, { inStock: e.target.checked })}
                    className="h-4 w-4 accent-[var(--color-nav-amethyst)]"
                  />
                  In stock
                </label>
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <span className={LABEL_CLASS}>{label}</span>
      {children}
    </div>
  );
}
