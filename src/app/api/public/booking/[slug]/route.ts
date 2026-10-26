import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import { enforcePublicBookingGetRateLimit } from "@/lib/server/public-booking-rate-limit";
import { loadPublicBookingBySlug } from "@/lib/server/booking/public-load";
import { normalizeBookingSlug, validateBookingSlug } from "@/lib/booking/slug";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug: raw } = await context.params;
  const slug = normalizeBookingSlug(typeof raw === "string" ? raw : "");
  if (validateBookingSlug(slug)) {
    return NextResponse.json({ error: "Link indisponível." }, { status: 404 });
  }

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicBookingGetRateLimit(ip);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const view = await loadPublicBookingBySlug(db, slug);
  if (!view) return NextResponse.json({ error: "Link indisponível." }, { status: 404 });

  return NextResponse.json(view, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
