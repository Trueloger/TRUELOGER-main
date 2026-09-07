"use client";

// On-page duration selector + Add to Cart for a consultation service
// subpage (src/app/consult/[slug]/page.tsx). Distinct from the OTHER
// agent's DurationSheet.tsx modal (used for the direct-add-to-cart flow
// from a /consult card) — this one renders inline since the subpage
// already gives the selector its own dedicated section, so a second
// modal on top of it would be redundant.
//
// Always resolves the final add-to-cart price via POST
// /api/consult/validate (server-owned pricing authority) rather than
// trusting the client-computed display price — see the doc comment on
// that route.
import { useId, useState } from "react";
import { DURATION_PRESETS, type ConsultationService } from "@/lib/consultation/types";
import { getConsultationPrice, formatInr, validateDuration } from "@/lib/consultation/pricing";
import { useCart } from "@/context/CartContext";
import { consultationVariantId } from "@/lib/consultation/types";

const DEFAULT_DURATION = 30;

export function ServiceDurationPicker({ service }: { service: ConsultationService }) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<number>(DEFAULT_DURATION);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const customInputId = useId();

  const customValidation = isCustom ? validateDuration(Number(customValue)) : null;
  const activeDuration = isCustom
    ? customValidation?.valid
      ? customValidation.duration
      : null
    : selected;

  const displayPrice =
    activeDuration !== null ? getConsultationPrice(service.pricing, activeDuration) : null;

  function choosePreset(duration: number) {
    setIsCustom(false);
    setSelected(duration);
    setStatus("idle");
    setErrorMessage(null);
  }

  function chooseCustom() {
    setIsCustom(true);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function handleAddToCart() {
    if (activeDuration === null) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/consult/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, duration: activeDuration }),
      });
      const data = (await res.json()) as
        | { serviceId: string; serviceName: string; duration: number; price: number }
        | { error: string };
      if (!res.ok || "error" in data) {
        const message = "error" in data ? data.error : "Could not add this to your cart.";
        setStatus("error");
        setErrorMessage(message);
        return;
      }
      addItem({
        id: consultationVariantId(data.serviceId, data.duration),
        name: service.name,
        price: data.price,
        type: "consultation",
        meta: {
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          duration: data.duration,
        },
      });
      setStatus("added");
      window.setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      setErrorMessage("Network error — please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 sm:p-6">
      <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Choose your duration</h2>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {DURATION_PRESETS.map((duration) => {
          const active = !isCustom && selected === duration;
          return (
            <button
              key={duration}
              type="button"
              onClick={() => choosePreset(duration)}
              aria-pressed={active}
              className={`flex min-h-[44px] min-w-[76px] items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "border-nav-amethyst bg-nav-amethyst text-white"
                  : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-soft"
              }`}
            >
              {duration} min
            </button>
          );
        })}
        <button
          type="button"
          onClick={chooseCustom}
          aria-pressed={isCustom}
          className={`flex min-h-[44px] min-w-[76px] items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${
            isCustom
              ? "border-nav-amethyst bg-nav-amethyst text-white"
              : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-soft"
          }`}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="mt-4">
          <label htmlFor={customInputId} className="block text-sm font-medium text-nav-plum">
            Custom duration (minutes)
          </label>
          <input
            id={customInputId}
            type="number"
            inputMode="numeric"
            min={15}
            max={60}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g. 40"
            className="mt-1.5 min-h-[44px] w-32 rounded-lg border border-nav-lavender-line bg-white px-3 text-nav-plum focus:border-nav-amethyst focus:outline-none"
          />
          <p className="mt-1 text-xs text-nav-plum/60">15–60 min</p>
          {customValue !== "" && customValidation && !customValidation.valid && (
            <p className="mt-1 text-xs text-red-600">{customValidation.reason}</p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-nav-lavender-line pt-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-nav-plum/60">Price</p>
          <p className="font-serif text-2xl text-nav-amethyst-deep">
            {displayPrice !== null ? formatInr(displayPrice) : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={activeDuration === null || status === "loading"}
          className="flex min-h-[44px] min-w-[160px] items-center justify-center rounded-full bg-nav-amethyst px-6 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Adding…" : status === "added" ? "Added ✓" : "Add to Cart"}
        </button>
      </div>

      {status === "error" && errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
