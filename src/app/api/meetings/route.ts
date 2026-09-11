// src/app/api/meetings/route.ts
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { listMeetingsForUser } from "@/lib/meetings/store";

export async function GET(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const meetings = await listMeetingsForUser(verified.uid);
  return NextResponse.json({ meetings });
}
