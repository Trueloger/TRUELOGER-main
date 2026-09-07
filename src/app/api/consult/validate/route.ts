// src/app/api/consult/validate/route.ts
// Server-side authoritative pricing for a consultation add-to-cart
// request. The client sends only serviceId + duration; this route
// looks up the real service, validates the duration, and computes the
// price itself from the server-owned pricing matrix — a client-supplied
// price is never accepted or trusted (see the "do not trust client-
// provided prices" requirement this route exists to satisfy). Every
// consultation UI (the direct-add-to-cart duration sheet AND the
// service-subpage duration selector) calls this before calling
// `addItem()`, so the number that lands in the cart always came from
// here, not from client arithmetic.
import { NextResponse } from "next/server";
import { getServiceById } from "@/lib/consultation/services-data";
import { getConsultationPrice, validateDuration } from "@/lib/consultation/pricing";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { serviceId, duration } = body as { serviceId?: unknown; duration?: unknown };

  if (typeof serviceId !== "string" || !serviceId) {
    return NextResponse.json({ error: "serviceId is required." }, { status: 400 });
  }

  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown consultation service." }, { status: 404 });
  }

  const durationCheck = validateDuration(duration);
  if (!durationCheck.valid) {
    return NextResponse.json({ error: durationCheck.reason }, { status: 400 });
  }

  const price = getConsultationPrice(service.pricing, durationCheck.duration);

  return NextResponse.json({
    serviceId: service.id,
    serviceName: service.name,
    duration: durationCheck.duration,
    price,
  });
}
