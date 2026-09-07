"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CartItemType = "product" | "consultation";

export type CartItem = {
  /** Unique cart line identity. A physical product uses its own product
   * id directly (unchanged legacy behavior); a consultation uses
   * `consultationVariantId(serviceId, duration)` (see
   * src/lib/consultation/types.ts) so the SAME service at two
   * different durations — e.g. "Vedic Astrology, 30 min" and "Vedic
   * Astrology, 60 min" — are two distinct, independently-removable
   * line items instead of one overwriting the other. */
  id: string;
  name: string;
  quantity: number;
  /** Unit price in whole rupees. Optional/omitted for any legacy
   * product line added before pricing existed on this context — those
   * render as "quantity only" wherever a UI needs to fall back
   * gracefully. Every consultation line always sets this, sourced from
   * `getConsultationPrice()` (see src/lib/consultation/pricing.ts) —
   * never a client-typed literal. */
  price?: number;
  /** Defaults to "product" when omitted, preserving the exact prior
   * behavior for every existing addItem({id, name}) call site (e.g.
   * ProductCard.tsx) — this field is additive, not a breaking change. */
  type?: CartItemType;
  /** Consultation-only metadata, present only when type === "consultation".
   * Kept as a nested object (rather than flattening serviceId/duration
   * onto CartItem directly) so a future second variant dimension
   * (expert, language, mode) can be added here without another
   * top-level CartItem field. */
  meta?: {
    serviceId: string;
    serviceName: string;
    duration: number;
  };
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
