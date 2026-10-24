import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";

function allowed(url: string) {
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

  const url = new URL(req.url).searchParams.get("url") || "";
  const name = new URL(req.url).searchParams.get("name") || "relatorio.pdf";
  if (!allowed(url)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }
  const response = await fetch(url);
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
