"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type CartItemType = "product" | "consultation" | "gemstone" | "report" | "service";

export type ConsultationCartMeta = {
  serviceId: string;
  serviceName: string;
  duration: number;
  /** Preferred appointment date/time, chosen BEFORE the item is added
   * to the cart (per the "ask date/time before cart" requirement) —
   * "YYYY-MM-DD" / "HH:mm" in BUSINESS_TIMEZONE
   * (src/lib/consultation/availability.ts), server-revalidated at
   * checkout, never trusted as final here. */
  preferredDate: string;
  preferredTime: string;
  timezone: string;
};

export type GemstoneCartMeta = {
  productId: string;
  productName: string;
  ratti: number;
};

/** Cart-line metadata for the 4 non-gemstone product categories
 * (bracelet/rudraksha/spiritual/yantra) added by the catalogue
 * expansion — gemstones keep using GemstoneCartMeta (ratti-specific,
 * already wired through every existing gemstone UI component) rather
 * than being folded into this shape, so nothing already shipped needs
 * to change. `category` mirrors src/lib/products/types.ts's
 * ProductCategory minus "gemstone". */
export type ProductCartMeta = {
  category: "bracelet" | "rudraksha" | "spiritual" | "yantra";
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
};

/** Cart-line metadata for a paid personalized report — one line per
 * report purchase, always quantity 1 (there's no "variant" or
 * duration to pick, unlike gemstones/consultations). */
export type ReportCartMeta = {
  reportSlug: string;
  reportName: string;
};

/** Cart-line metadata for Healing / Puja / Course purchases — the
 * shared "simple service" model (src/lib/services/types.ts). One line
 * per booking/enrollment, always quantity 1, same shape for all three
 * categories since they're commercially identical. */
export type ServiceCartMeta = {
  category: "healing" | "puja" | "course";
  productId: string;
  productName: string;
};

export type CartItem = {
  /** Unique cart line identity. A physical product uses its own product
   * id directly (unchanged legacy behavior); a consultation uses
   * `consultationVariantId(serviceId, duration)` (see
   * src/lib/consultation/types.ts) and a gemstone uses
   * `gemstoneVariantId(productId, ratti)` (see
   * src/lib/gemstones/types.ts) so the SAME service/product at two
   * different durations/weights — e.g. "Blue Sapphire, 3 Ratti" and
   * "Blue Sapphire, 5 Ratti" — are two distinct, independently-
   * removable line items instead of one overwriting the other. */
  id: string;
  name: string;
  quantity: number;
  /** Unit price in whole rupees. Optional/omitted for any legacy
   * product line added before pricing existed on this context — those
   * render as "quantity only" wherever a UI needs to fall back
   * gracefully. Every consultation/gemstone line always sets this,
   * sourced from `getConsultationPrice()` /`getGemstonePrice()` — never
   * a client-typed literal. */
  price?: number;
  /** Defaults to "product" when omitted, preserving the exact prior
   * behavior for every existing addItem({id, name}) call site (e.g.
   * ProductCard.tsx) — this field is additive, not a breaking change. */
  type?: CartItemType;
  /** Present only when `type` is "consultation" or "gemstone" — the
   * two meta shapes are a union (not merged into one loose object) so
   * a consumer that already checked `type` gets real field names for
   * the matching shape, not an ambiguous grab-bag. Kept nested (rather
   * than flattened onto CartItem) so a future second variant dimension
   * (expert, language, mode, gemstone treatment) can be added to either
   * shape without another top-level CartItem field. */
  meta?: ConsultationCartMeta | GemstoneCartMeta | ProductCartMeta | ReportCartMeta | ServiceCartMeta;
};

type AddCartItemInput = {
  id: string;
  name: string;
  price?: number;
  type?: CartItemType;
  meta?: CartItem["meta"];
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** Sum of price*quantity across every line that has a price. Lines
   * with no price (legacy product items added before pricing existed)
   * contribute 0, never NaN. */
  subtotal: number;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  /** Removes the entire line regardless of quantity — the cart drawer's
   * explicit "Remove" action, distinct from removeItem's one-at-a-time
   * decrement (kept for the existing product quantity-stepper use). */
  removeLine: (id: string) => void;
  /** Empties the whole cart — used exactly once, by the order
   * confirmation page, and ONLY after a payment is confirmed PAID
   * (never on a failed/pending/cancelled outcome, and never as a side
   * effect of navigation — see the persistence comment above for why
   * this needs to be explicit now that the cart survives reloads). */
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Persisted so the cart survives a full browser navigation, not just
// client-side routing — this context previously lived ONLY in React
// memory, which worked fine for in-app Link navigation (CartProvider
// sits above the router) but not for the one flow that forces a real,
// full-page navigation away from and back to the site: Cashfree's
// hosted checkout redirect (`redirectTarget: "_self"` in
// checkout/page.tsx actually replaces the tab, it doesn't SPA-route).
// That wiped the cart on return regardless of whether the payment
// succeeded or failed — harmless on success (there's nothing left to
// buy), but on a FAILED payment it meant "Try Payment Again" sent the
// user to a checkout page with an empty cart and nothing to pay for.
// localStorage is the fix: same survives-everything guarantee, still
// entirely client-side/per-browser, no account or server involved.
const CART_STORAGE_KEY = "trueloger-cart-v1";

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    // Corrupted JSON, storage disabled, or private-mode quota — fail
    // open to an empty cart rather than crashing the whole app.
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Guards the persist-effect below from firing (and overwriting the
  // real saved cart with an empty array) before the hydrate-effect has
  // actually had a chance to read localStorage — both effects run
  // after the same initial render, so without this the persist-effect
  // could run first.
  const hydratedRef = useRef(false);

  // Client-only hydration from localStorage, deliberately NOT a lazy
  // useState initializer — reading localStorage during the render that
  // also produces the server-rendered HTML would make the client's
  // first render disagree with that HTML (a hydration mismatch)
  // anywhere the cart's contents affect what's shown (cart badge
  // count, drawer contents). Running it in an effect means it applies
  // just after hydration completes instead, which is the same
  // trade-off CookieConsentBanner already makes for the same reason.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with an external system (localStorage), not derived state
    setItems(readStoredCart());
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/disabled — the cart still works for this session,
      // it just won't survive a full page reload. Not worth surfacing.
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0,
    );

    return {
      items,
      itemCount,
      subtotal,
      addItem: ({ id, name, price, type, meta }) =>
        setItems((prev) => {
          const existing = prev.find((item) => item.id === id);
          if (existing) {
            return prev.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
            );
          }
          return [...prev, { id, name, quantity: 1, price, type, meta }];
        }),
      removeItem: (id) =>
        setItems((prev) =>
          prev
            .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0),
        ),
      removeLine: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
      clearCart: () => setItems([]),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
