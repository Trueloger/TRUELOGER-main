// src/app/api/admin/coupons/[code]/route.ts
// Admin-only coupon update + delete.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { updateCoupon, deleteCoupon } from "@/lib/coupons/store";
import type { Coupon } from "@/lib/coupons/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { code } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid coupon data." }, { status: 400 });
  }

  const updated = await updateCoupon(code, body as Partial<Coupon>);
  if (!updated) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  return NextResponse.json({ coupon: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { code } = await params;
  await deleteCoupon(code);
  return NextResponse.json({ ok: true });
}
