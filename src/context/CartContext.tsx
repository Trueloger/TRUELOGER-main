"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CartItemType = "product" | "consultation" | "gemstone";

export type ConsultationCartMeta = {
  serviceId: string;
  serviceName: string;
  duration: number;
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
  meta?: ConsultationCartMeta | GemstoneCartMeta | ProductCartMeta;
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
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
