// src/app/api/orders/[id]/route.ts
// One order's detail — the owner or an admin only. Returns 404 (not
// 403) for someone else's order id, so a probing request can't even
// learn that a given order id exists.
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { getOrder } from "@/lib/orders/store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const verified = await verifyRequest(request);
  if (!verified) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || (order.userId !== verified.uid && !verified.isAdmin)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
