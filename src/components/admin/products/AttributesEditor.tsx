"use client";

// src/components/admin/products/AttributesEditor.tsx
// Every ProductAttributes field, all optional — every category shares
// the one field set (per the "don't force irrelevant fields" note on
// the type itself; the storefront only renders fields actually
// present). List-shaped fields (benefits/careInstructions/suitableFor)
// are edited as one-per-line textareas and split/joined by the parent.
import type { ReactNode } from "react";
import { INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "./form-styles";

export type AttributesForm = {
  alternateName: string;
  rulingPlanet: string;
  associatedDeity: string;
  associatedDay: string;
  associatedMetal: string;
  wearingFinger: string;
  wearingMethod: string;
  mantra: string;
  material: string;
  origin: string;
  size: string;
  astrologicalSignificance: string;
  benefits: string; // one per line
  careInstructions: string; // one per line
  suitableFor: string; // one per line
};

export function emptyAttributesForm(): AttributesForm {
  return {
    alternateName: "",
    rulingPlanet: "",
    associatedDeity: "",
    associatedDay: "",
    associatedMetal: "",
    wearingFinger: "",
    wearingMethod: "",
    mantra: "",
    material: "",
    origin: "",
    size: "",
    astrologicalSignificance: "",
    benefits: "",
    careInstructions: "",
    suitableFor: "",
  };
}

const TEXT_FIELDS: { key: keyof AttributesForm; label: string; placeholder?: string }[] = [
  { key: "alternateName", label: "Alternate / traditional name", placeholder: "Manik, Panna…" },
  { key: "rulingPlanet", label: "Ruling planet" },
  { key: "associatedDeity", label: "Associated deity" },
  { key: "associatedDay", label: "Associated day" },
  { key: "associatedMetal", label: "Associated metal" },
  { key: "wearingFinger", label: "Wearing finger" },
  { key: "wearingMethod", label: "Wearing method" },
  { key: "mantra", label: "Mantra" },
  { key: "material", label: "Material" },
  { key: "origin", label: "Origin" },
  { key: "size", label: "Size (when not variant-driven)" },
];

export function AttributesEditor({
  attributes,
  onChange,
}: {
  attributes: AttributesForm;
  onChange: (attributes: AttributesForm) => void;
}) {
  function set<K extends keyof AttributesForm>(key: K, value: AttributesForm[K]) {
    onChange({ ...attributes, [key]: value });
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
      <h2 className="font-serif text-lg text-nav-violet">Attributes</h2>
      <p className="mt-1 text-xs text-nav-plum/60">All optional — only filled-in fields are saved and shown on the product page.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEXT_FIELDS.map(({ key, label, placeholder }) => (
          <AttrField key={key} label={label}>
            <input
              value={attributes[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className={INPUT_CLASS}
            />
          </AttrField>
        ))}
      </div>

      <div className="mt-3">
        <AttrField label="Astrological significance">
          <textarea
            value={attributes.astrologicalSignificance}
            onChange={(e) => set("astrologicalSignificance", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </AttrField>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AttrField label="Benefits (one per line)">
          <textarea
            value={attributes.benefits}
            onChange={(e) => set("benefits", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </AttrField>
        <AttrField label="Care instructions (one per line)">
          <textarea
            value={attributes.careInstructions}
            onChange={(e) => set("careInstructions", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </AttrField>
        <AttrField label="Suitable for (one per line)">
          <textarea
            value={attributes.suitableFor}
            onChange={(e) => set("suitableFor", e.target.value)}
            className={TEXTAREA_CLASS}
          />
        </AttrField>
      </div>
    </div>
  );
}

function AttrField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      {children}
    </div>
  );
}
