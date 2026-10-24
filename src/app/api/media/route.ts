import { NextResponse } from "next/server";
import type { CloudinaryResourceType } from "@/lib/cloudinary/asset";
import { authorizeClinicMediaAccess } from "@/lib/server/cloudinary-media-access";
import { cloudinaryConfigured, configureCloudinary, signedAuthenticatedUrl } from "@/lib/server/cloudinary-sign";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

function parseResourceType(value: string | null): CloudinaryResourceType | null {
  if (value === "image" || value === "raw" || value === "video") return value;
  return null;
}

export async function GET(req: Request) {
  const auth = await requireAuthUser(req);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary não está configurado." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const publicId = searchParams.get("publicId")?.trim() || "";
  const resourceType = parseResourceType(searchParams.get("resourceType"));
  const format = searchParams.get("format")?.trim() || undefined;
  const mode = searchParams.get("mode") === "json" ? "json" : "redirect";

  if (!publicId || !resourceType) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const allowed = await authorizeClinicMediaAccess(publicId, auth.uid);
  if (!allowed) {
    return NextResponse.json({ error: "Sem permissão para este arquivo." }, { status: 403 });
  }

  configureCloudinary();
  const url = signedAuthenticatedUrl({ publicId, resourceType, format });

  if (mode === "json") {
    return NextResponse.json({ url, expiresInSeconds: 300 }, { status: 200 });
  }
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
