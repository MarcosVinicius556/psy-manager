import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import { enforcePublicBookingPostRateLimit } from "@/lib/server/public-booking-rate-limit";
import { createPublicBookingRequest } from "@/lib/server/booking/create-request";
import { normalizeBookingSlug, validateBookingSlug } from "@/lib/booking/slug";
import type { Modality } from "@/lib/admin/types";

type RouteContext = { params: Promise<{ slug: string }> };

function message(reason: string) {
  switch (reason) {
    case "consentimento":
      return "É necessário aceitar o aviso de privacidade.";
    case "nome":
      return "Informe seu nome.";
    case "email":
      return "Informe um e-mail válido.";
    case "telefone":
      return "Informe um telefone para contato.";
    case "modalidade":
      return "Modalidade indisponível.";
    case "horario_indisponivel":
      return "Este horário não está mais disponível. Escolha outro.";
    case "somente_pacientes":
      return "Este profissional aceita pedidos apenas de pacientes já cadastrados.";
    case "spam":
      return "Não foi possível enviar.";
    default:
      return "Não foi possível enviar o pedido.";
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { slug: raw } = await context.params;
  const slug = normalizeBookingSlug(typeof raw === "string" ? raw : "");
  if (validateBookingSlug(slug)) {
    return NextResponse.json({ error: "Link indisponível." }, { status: 404 });
  }

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicBookingPostRateLimit(ip, slug);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const modalityRaw = typeof payload.modality === "string" ? payload.modality : "online";
  const modality: Modality = modalityRaw === "presencial" ? "presencial" : "online";

  const result = await createPublicBookingRequest(
    db,
    {
      slug,
      patientName: typeof payload.name === "string" ? payload.name : "",
      patientEmail: typeof payload.email === "string" ? payload.email : "",
      patientPhone: typeof payload.phone === "string" ? payload.phone : "",
      modality,
      date: typeof payload.date === "string" ? payload.date : "",
      startTime: typeof payload.startTime === "string" ? payload.startTime : "",
      endTime: typeof payload.endTime === "string" ? payload.endTime : "",
      consent: payload.consent === true,
      honeypot: typeof payload.company === "string" ? payload.company : "",
    },
    ip
  );

  if (!result.ok) {
    const status = result.reason === "indisponivel" ? 404 : result.reason === "spam" ? 400 : 409;
    return NextResponse.json({ error: message(result.reason) }, { status });
  }

  return NextResponse.json({ success: true, requestId: result.requestId });
}
