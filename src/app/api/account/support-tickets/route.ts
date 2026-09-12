// src/app/api/account/support-tickets/route.ts
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { listTicketsForUser } from "@/lib/support/store";

export async function GET(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const tickets = await listTicketsForUser(verified.uid);
  return NextResponse.json({ tickets });
}
