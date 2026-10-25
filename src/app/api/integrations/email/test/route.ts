import { NextResponse } from "next/server";
import { enforceEmailRateLimit } from "@/lib/server/email-rate-limit";
import { requireEmailUser } from "@/lib/email-integration/api-auth";
import { sendProfessionalEmail } from "@/lib/email-integration/send-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEmailUser(request);
  if ("error" in auth) return auth.error;

  const limited = await enforceEmailRateLimit(auth.uid);
  if (limited) return limited;

  const body = (await request.json()) as { to?: string };
  const to = typeof body.to === "string" && body.to.trim() ? body.to.trim() : auth.email || "";
  if (!to) return NextResponse.json({ reason: "destino_ausente" }, { status: 400 });

  try {
    await sendProfessionalEmail({
      ownerUid: auth.uid,
      to,
      subjectTemplate: "Teste de envio — Psy Manager",
      bodyTemplate: `Este é um e-mail de teste enviado pelo Psy Manager em ${new Date().toLocaleString("pt-BR")}.

Se você recebeu esta mensagem, a integração está funcionando.`,
      context: {},
      relatedType: "teste",
      relatedId: auth.uid,
    });
    return NextResponse.json({ sent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha_envio";
    return NextResponse.json({ sent: false, reason: message }, { status: 502 });
  }
}
