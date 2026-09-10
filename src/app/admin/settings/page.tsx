"use client";

// src/app/admin/settings/page.tsx
// Admin Settings screen: Tax (GST) rules and Delivery fee configuration.
// Reads/writes the two singleton settings docs via GET/PUT
// /api/admin/settings — see src/lib/settings/types.ts for the frozen
// shapes and src/app/api/admin/settings/route.ts for the validation
// this screen has to satisfy. Each section (Tax / Delivery) saves
// independently, PUTing only the section that changed.
import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_DELIVERY_SETTINGS,
  type TaxRule,
  type TaxSettings,
  type DeliverySettings,
} from "@/lib/settings/types";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, type ProductCategory } from "@/lib/products/types";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

type SectionSaveState = { status: "idle" | "saving" | "success" | "error"; message?: string };

export default function AdminSettingsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Tax section local state
  const [taxRules, setTaxRules] = useState<TaxRule[]>(DEFAULT_TAX_SETTINGS.rules);
  const [pricesIncludeTax, setPricesIncludeTax] = useState<boolean>(DEFAULT_TAX_SETTINGS.pricesIncludeTax ?? false);
  const [taxSave, setTaxSave] = useState<SectionSaveState>({ status: "idle" });

  // Delivery section local state
  const [defaultFee, setDefaultFee] = useState<number>(DEFAULT_DELIVERY_SETTINGS.defaultFee);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | "">(
    DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold ?? "",
  );
  const [categoryFees, setCategoryFees] = useState<Record<string, number | "">>({});
  const [deliverySave, setDeliverySave] = useState<SectionSaveState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch("/api/admin/settings");
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { tax: TaxSettings; delivery: DeliverySettings };
        if (cancelled) return;

        setTaxRules(data.tax.rules.length > 0 ? data.tax.rules : DEFAULT_TAX_SETTINGS.rules);
        setPricesIncludeTax(data.tax.pricesIncludeTax ?? false);

        setDefaultFee(data.delivery.defaultFee ?? DEFAULT_DELIVERY_SETTINGS.defaultFee);
        setFreeDeliveryThreshold(
          data.delivery.freeDeliveryThreshold !== undefined ? data.delivery.freeDeliveryThreshold : "",
        );
        const fees: Record<string, number | ""> = {};
        for (const [cat, fee] of Object.entries(data.delivery.categoryFees ?? {})) {
          fees[cat] = fee;
        }
        setCategoryFees(fees);

        setState({ status: "ready" });
      } catch {
        if (!cancelled) setState({ status: "error", message: "We couldn't load settings right now." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRule(index: number, patch: Partial<TaxRule>) {
    setTaxRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function toggleRuleCategory(index: number, category: ProductCategory) {
    setTaxRules((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const current = r.categoryRestriction ?? [];
        const next = current.includes(category)
          ? current.filter((c) => c !== category)
          : [...current, category];
        return { ...r, categoryRestriction: next.length > 0 ? next : undefined };
      }),
    );
  }

  function addRule() {
    setTaxRules((prev) => [...prev, { name: "", ratePercent: 0, active: true }]);
  }

  function removeRule(index: number) {
    setTaxRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveTax() {
    setTaxSave({ status: "saving" });
    if (taxRules.some((r) => !r.name.trim())) {
      setTaxSave({ status: "error", message: "Every tax rule needs a name." });
      return;
    }
    if (taxRules.some((r) => typeof r.ratePercent !== "number" || Number.isNaN(r.ratePercent) || r.ratePercent < 0)) {
      setTaxSave({ status: "error", message: "Tax rates must be zero or a positive number." });
      return;
    }
    try {
      const res = await authedFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ tax: { rules: taxRules, pricesIncludeTax } }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setTaxSave({ status: "error", message: body?.error ?? "Couldn't save tax settings." });
        return;
      }
      setTaxSave({ status: "success" });
    } catch {
      setTaxSave({ status: "error", message: "Couldn't save tax settings." });
    }
  }

  async function handleSaveDelivery() {
    setDeliverySave({ status: "saving" });
    if (typeof defaultFee !== "number" || Number.isNaN(defaultFee) || defaultFee < 0) {
      setDeliverySave({ status: "error", message: "Default delivery fee must be zero or a positive number." });
      return;
    }
    const resolvedCategoryFees: Record<string, number> = {};
    for (const [cat, fee] of Object.entries(categoryFees)) {
      if (fee === "" || fee === undefined) continue;
      if (typeof fee !== "number" || Number.isNaN(fee) || fee < 0) {
        setDeliverySave({ status: "error", message: "Category delivery fees must be zero or a positive number." });
        return;
      }
      resolvedCategoryFees[cat] = fee;
    }
    try {
      const res = await authedFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          delivery: {
            defaultFee,
            freeDeliveryThreshold: freeDeliveryThreshold === "" ? undefined : freeDeliveryThreshold,
            categoryFees: Object.keys(resolvedCategoryFees).length > 0 ? resolvedCategoryFees : undefined,
          },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setDeliverySave({ status: "error", message: body?.error ?? "Couldn't save delivery settings." });
        return;
      }
      setDeliverySave({ status: "success" });
    } catch {
      setDeliverySave({ status: "error", message: "Couldn't save delivery settings." });
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Configure store-wide tax and delivery rules.</p>
      </header>

      {state.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
        >
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading settings…</p>
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {state.message}
        </div>
      )}

      {state.status === "ready" && (
        <div className="flex flex-col gap-6">
          {/* Tax (GST) section */}
          <section className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="font-serif text-lg text-nav-violet">Tax (GST)</h2>
              <p className="mt-1 text-sm text-nav-plum/70">
                Every active rule whose category (if any) matches a line item is summed for that line. Leave a
                rule&apos;s categories empty to apply it to everything — e.g. the default is a flat {DEFAULT_TAX_SETTINGS.rules[0]?.ratePercent}%
                GST on all products.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {taxRules.map((rule, index) => (
                <div key={index} className="rounded-xl border border-nav-lavender-line bg-nav-pearl/50 p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                    <label className="flex-1 text-sm">
                      <span className="mb-1 block font-medium text-nav-plum/80">Rule name</span>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateRule(index, { name: e.target.value })}
                        placeholder="GST"
                        className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
                      />
                    </label>
                    <label className="w-full text-sm sm:w-32">
                      <span className="mb-1 block font-medium text-nav-plum/80">Rate %</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={rule.ratePercent}
                        onChange={(e) => updateRule(index, { ratePercent: e.target.valueAsNumber || 0 })}
                        className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
                      />
                    </label>
                    <label className="flex min-h-11 items-center gap-2 text-sm text-nav-plum/80">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={(e) => updateRule(index, { active: e.target.checked })}
                        className="h-4 w-4 rounded border-nav-lavender-line accent-nav-amethyst"
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="flex min-h-11 shrink-0 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-nav-plum/60">
                      Applies to (leave unselected for every category)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRODUCT_CATEGORIES.map((cat) => {
                        const selected = (rule.categoryRestriction ?? []).includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleRuleCategory(index, cat)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                              selected
                                ? "bg-nav-amethyst text-white"
                                : "bg-nav-lavender-mist text-nav-plum/70 hover:text-nav-violet"
                            }`}
                          >
                            {PRODUCT_CATEGORY_LABELS[cat]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {taxRules.length === 0 && (
                <p className="rounded-xl border border-nav-lavender-line bg-nav-pearl/50 px-4 py-6 text-center text-sm text-nav-plum/70">
                  No tax rules configured. Add one below.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={addRule}
              className="mt-3 flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-2 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
            >
              + Add rule
            </button>

            <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-nav-plum/80">
              <input
                type="checkbox"
                checked={pricesIncludeTax}
                onChange={(e) => setPricesIncludeTax(e.target.checked)}
                className="h-4 w-4 rounded border-nav-lavender-line accent-nav-amethyst"
              />
              Displayed prices already include tax (tax is not added on top at checkout)
            </label>

            <div className="mt-4 flex flex-col gap-2 border-t border-nav-lavender-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleSaveTax}
                disabled={taxSave.status === "saving"}
                className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {taxSave.status === "saving" ? "Saving…" : "Save Tax Settings"}
              </button>
              {taxSave.status === "success" && (
                <p role="status" className="text-sm font-medium text-emerald-700">
                  Tax settings saved.
                </p>
              )}
              {taxSave.status === "error" && (
                <p role="alert" className="text-sm font-medium text-rose-600">
                  {taxSave.message}
                </p>
              )}
            </div>
          </section>

          {/* Delivery section */}
          <section className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="font-serif text-lg text-nav-violet">Delivery</h2>
              <p className="mt-1 text-sm text-nav-plum/70">
                Set the default delivery fee, the cart value at which delivery becomes free, and optional per-category
                overrides.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-nav-plum/80">Default delivery fee (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={defaultFee}
                  onChange={(e) => setDefaultFee(e.target.valueAsNumber || 0)}
                  className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-nav-plum/80">Free delivery threshold (₹, optional)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(e.target.value === "" ? "" : e.target.valueAsNumber || 0)}
                  placeholder="No threshold"
                  className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
                />
              </label>
            </div>

            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-nav-plum/80">Per-category fee overrides (optional)</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <label key={cat} className="text-sm">
                    <span className="mb-1 block text-nav-plum/70">{PRODUCT_CATEGORY_LABELS[cat]}</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={categoryFees[cat] ?? ""}
                      onChange={(e) =>
                        setCategoryFees((prev) => ({
                          ...prev,
                          [cat]: e.target.value === "" ? "" : e.target.valueAsNumber || 0,
                        }))
                      }
                      placeholder={`Default (₹${defaultFee})`}
                      className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-nav-lavender-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleSaveDelivery}
                disabled={deliverySave.status === "saving"}
                className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deliverySave.status === "saving" ? "Saving…" : "Save Delivery Settings"}
              </button>
              {deliverySave.status === "success" && (
                <p role="status" className="text-sm font-medium text-emerald-700">
                  Delivery settings saved.
                </p>
              )}
              {deliverySave.status === "error" && (
                <p role="alert" className="text-sm font-medium text-rose-600">
                  {deliverySave.message}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
