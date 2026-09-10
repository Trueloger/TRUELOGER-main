// src/app/api/admin/coupons/route.ts
// Admin-only coupon listing + create.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { createCoupon, listAllCouponsForAdmin } from "@/lib/coupons/store";
import type { Coupon } from "@/lib/coupons/types";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const coupons = await listAllCouponsForAdmin();
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid coupon data." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (typeof b.code !== "string" || !b.code.trim()) return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
  if (b.discountType !== "percentage" && b.discountType !== "fixed") {
    return NextResponse.json({ error: "discountType must be 'percentage' or 'fixed'." }, { status: 400 });
  }
  if (typeof b.value !== "number" || b.value <= 0) return NextResponse.json({ error: "value must be a positive number." }, { status: 400 });
  if (b.discountType === "percentage" && b.value > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100." }, { status: 400 });
  }
  if (typeof b.startDate !== "number" || typeof b.endDate !== "number" || b.endDate <= b.startDate) {
    return NextResponse.json({ error: "endDate must be after startDate." }, { status: 400 });
  }

  const coupon = await createCoupon({
    code: b.code,
    discountType: b.discountType,
    value: b.value,
    maxDiscount: typeof b.maxDiscount === "number" ? b.maxDiscount : undefined,
    minCartValue: typeof b.minCartValue === "number" ? b.minCartValue : undefined,
    startDate: b.startDate,
    endDate: b.endDate,
    usageLimit: typeof b.usageLimit === "number" ? b.usageLimit : undefined,
    perUserLimit: typeof b.perUserLimit === "number" ? b.perUserLimit : undefined,
    categoryRestriction: Array.isArray(b.categoryRestriction) ? (b.categoryRestriction as string[]) : undefined,
    productRestriction: Array.isArray(b.productRestriction) ? (b.productRestriction as string[]) : undefined,
    active: typeof b.active === "boolean" ? b.active : true,
    description: typeof b.description === "string" ? b.description : undefined,
  } as Omit<Coupon, "code" | "createdAt" | "updatedAt"> & { code: string });

  return NextResponse.json({ coupon });
}
