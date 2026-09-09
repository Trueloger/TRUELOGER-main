// src/app/api/orders/route.ts
// The signed-in user's own orders — never another user's. Ownership
// is enforced by querying on the VERIFIED uid from the ID token, not
// anything the client could pass in.
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { listOrdersForUser } from "@/lib/orders/store";

export async function GET(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  const orders = await listOrdersForUser(verified.uid);
  return NextResponse.json({ orders });
}
