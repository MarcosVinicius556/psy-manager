import { NextResponse } from "next/server";
import type { CloudinaryResourceType } from "@/lib/cloudinary/asset";
import { authorizeClinicMediaAccess } from "@/lib/server/cloudinary-media-access";
import { cloudinaryConfigured, configureCloudinary, signedAuthenticatedUrl } from "@/lib/server/cloudinary-sign";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

function allowedLegacyUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "res.cloudinary.com" || host.endsWith(".cloudinary.com");
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const auth = await requireAuthUser(req);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const params = new URL(req.url).searchParams;
  const name = params.get("name") || "relatorio.pdf";
  const publicId = params.get("publicId")?.trim() || "";
  const resourceType = params.get("resourceType") as CloudinaryResourceType | null;

  let fetchUrl = params.get("url") || "";
  if (publicId && resourceType) {
    if (!cloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary não está configurado." }, { status: 500 });
    }
    const allowed = await authorizeClinicMediaAccess(publicId, auth.uid);
    if (!allowed) {
      return NextResponse.json({ error: "Sem permissão para este arquivo." }, { status: 403 });
    }
    configureCloudinary();
    const format = params.get("format")?.trim() || undefined;
    fetchUrl = signedAuthenticatedUrl({ publicId, resourceType, format });
  } else if (!allowedLegacyUrl(fetchUrl)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    return NextResponse.json({ error: "Não foi possível abrir o PDF." }, { status: 502 });
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    return NextResponse.json({ error: "Este arquivo não é um PDF válido. Gere o relatório de novo." }, { status: 415 });
  }
  const filename = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
