// src/components/admin/products/StatusBadge.tsx
// Small status pill shared by the product list and (implicitly, via the
// same palette choices) the edit form — mirrors the color language of
// PaymentBadge in src/app/admin/orders/page.tsx (emerald = good/live,
// amber = in-progress/draft, rose = terminal/archived) rather than
// inventing a new admin color scheme.
import type { ProductStatus } from "@/lib/products/types";

export function StatusBadge({ status }: { status: ProductStatus }) {
  const style =
    status === "published"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "draft"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium capitalize ring-1 ${style}`}>
      {status}
    </span>
  );
}
