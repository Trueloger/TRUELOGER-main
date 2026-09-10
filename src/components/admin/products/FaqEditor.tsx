"use client";

// src/components/admin/products/FaqEditor.tsx
// Add/remove question+answer pairs for Product.faqs.
import { Trash2 } from "lucide-react";
import type { ProductFaq } from "@/lib/products/types";
import { INPUT_CLASS, LABEL_CLASS, TEXTAREA_CLASS } from "./form-styles";

export function FaqEditor({ faqs, onChange }: { faqs: ProductFaq[]; onChange: (faqs: ProductFaq[]) => void }) {
  function updateRow(index: number, patch: Partial<ProductFaq>) {
    onChange(faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeRow(index: number) {
    onChange(faqs.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...faqs, { question: "", answer: "" }]);
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg text-nav-violet">FAQs</h2>
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-nav-lavender-line bg-white px-3 py-1.5 text-xs font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          + Add FAQ
        </button>
      </div>

      {faqs.length === 0 && <p className="mt-2 text-xs text-nav-plum/60">No FAQs yet.</p>}

      <div className="mt-3 flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <div key={index} className="rounded-xl border border-nav-lavender-line bg-nav-pearl/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-nav-plum/60">FAQ {index + 1}</span>
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remove FAQ"
                className="rounded-full p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div>
                <span className={LABEL_CLASS}>Question</span>
                <input
                  value={faq.question}
                  onChange={(e) => updateRow(index, { question: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <span className={LABEL_CLASS}>Answer</span>
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateRow(index, { answer: e.target.value })}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
