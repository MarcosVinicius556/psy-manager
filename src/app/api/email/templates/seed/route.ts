import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/email-integration/templates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ seeded: 0, reason: "firebase_admin" }, { status: 503 });

  const existing = await db.collection("emailTemplates").where("ownerUid", "==", auth.uid).limit(1).get();
  if (!existing.empty) return NextResponse.json({ seeded: 0, already: true });

  const now = new Date().toISOString();
  let count = 0;
  for (const item of DEFAULT_EMAIL_TEMPLATES) {
    await db.collection("emailTemplates").add({
      nome: item.nome,
      trigger: item.trigger,
      assunto: item.assunto,
      corpo: item.corpo,
      anexo: item.anexo,
      autoSend: false,
      arquivado: false,
      versao: 1,
      historico: [
        {
          id: randomUUID(),
          versao: 1,
          quando: now,
          resumo: "Modelo padrão",
          nome: item.nome,
          assunto: item.assunto,
          corpo: item.corpo,
        },
      ],
      ownerUid: auth.uid,
      createdAt: now,
      updatedAt: now,
    });
    count += 1;
  }
  return NextResponse.json({ seeded: count });
}
