"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatInr } from "@/lib/consultation/pricing";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-nav-amethyst-deep">
          Your cart is empty
        </h1>
        <p className="text-sm text-nav-plum">
          Add a consultation or product to your cart before checking out.
        </p>
        <Link
          href="/consult"
          className="rounded-full border border-nav-lavender-line bg-nav-pearl px-5 py-2.5 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
        >
          Browse Consultations
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-nav-amethyst-deep">
        Checkout Summary
      </h1>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <CheckoutLineRow key={item.id} item={item} />
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-nav-lavender-line bg-nav-pearl px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-nav-plum">Subtotal</span>
          <span className="font-serif text-xl font-semibold text-nav-amethyst-deep">
            {formatInr(subtotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          // No live payment gateway is wired up yet — this is intentionally
          // a no-op placeholder rather than a fabricated success flow.
          console.log("Proceed to Payment clicked — payment gateway not yet integrated.");
        }}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-nav-amethyst px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
      >
        Proceed to Payment
      </button>
      <p className="mt-2 text-center text-xs text-nav-plum">
        Payment is not yet enabled — this button does not place a real order.
      </p>
    </main>
  );
}

function CheckoutLineRow({ item }: { item: CartItem }) {
  const isConsultation = item.type === "consultation";
  const isGemstone = item.type === "gemstone";
  const consultMeta = isConsultation ? (item.meta as { serviceName: string; duration: number } | undefined) : undefined;
  const gemstoneMeta = isGemstone ? (item.meta as { productName: string; ratti: number } | undefined) : undefined;

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-nav-violet">
          {consultMeta?.serviceName ?? gemstoneMeta?.productName ?? item.name}
        </span>
        {consultMeta && <span className="text-xs text-nav-plum">{consultMeta.duration} min</span>}
        {gemstoneMeta && <span className="text-xs text-nav-plum">{gemstoneMeta.ratti} Ratti</span>}
        <span className="text-xs text-nav-plum">Qty: {item.quantity}</span>
      </div>
      {typeof item.price === "number" && (
        <span className="shrink-0 text-sm font-semibold text-nav-amethyst-deep">
          {formatInr(item.price * item.quantity)}
        </span>
      )}
    </li>
  );
}
