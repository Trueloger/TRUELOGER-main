"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type CartContextValue = {
  itemCount: number;
  addItem: () => void;
  removeItem: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const value = useMemo<CartContextValue>(
    () => ({
      itemCount,
      addItem: () => setItemCount((n) => n + 1),
      removeItem: () => setItemCount((n) => Math.max(0, n - 1)),
    }),
    [itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
