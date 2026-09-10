// src/app/api/admin/settings/route.ts
// Admin-only tax + delivery configuration — the ONLY write path for
// src/lib/settings/store.ts's two singleton docs. GET is admin-only
// too (not public) since it's reached from the admin Settings screen;
// the CUSTOMER-facing numbers these produce are only ever exposed
// indirectly, already baked into a /api/coupons/preview or
// /api/payments/create-order response, never as raw settings.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getTaxSettings, getDeliverySettings, setTaxSettings, setDeliverySettings } from "@/lib/settings/store";
import type { TaxSettings, DeliverySettings } from "@/lib/settings/types";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [tax, delivery] = await Promise.all([getTaxSettings(), getDeliverySettings()]);
  return NextResponse.json({ tax, delivery });
}

export async function PUT(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const b = (body as { tax?: Omit<TaxSettings, "updatedAt">; delivery?: Omit<DeliverySettings, "updatedAt"> }) ?? {};

  if (b.tax) {
    if (!Array.isArray(b.tax.rules) || b.tax.rules.some((r) => typeof r.ratePercent !== "number" || r.ratePercent < 0)) {
      return NextResponse.json({ error: "Invalid tax rules." }, { status: 400 });
    }
    await setTaxSettings(b.tax);
  }
  if (b.delivery) {
    if (typeof b.delivery.defaultFee !== "number" || b.delivery.defaultFee < 0) {
      return NextResponse.json({ error: "Invalid delivery fee." }, { status: 400 });
    }
    await setDeliverySettings(b.delivery);
  }

  const [tax, delivery] = await Promise.all([getTaxSettings(), getDeliverySettings()]);
  return NextResponse.json({ tax, delivery });
}
