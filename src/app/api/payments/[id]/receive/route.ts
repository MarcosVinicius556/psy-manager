import { NextResponse } from "next/server";
import { receiptPatch } from "@/lib/admin/finance";
import type { ClinicAttachment, Payment, PaymentMethod } from "@/lib/admin/types";
import { maybeSendPaymentConfirmationEmail } from "@/lib/email-integration/automation";
import { paymentOwnedByUid } from "@/lib/server/clinic-access";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

function mapPayment(data: FirebaseFirestore.DocumentData, id: string): Payment {
  return { id, ...(data as Omit<Payment, "id">) };
}

function mapAttachment(value: unknown): ClinicAttachment | null {
  if (!value || typeof value !== "object") return null;
  const url = typeof (value as { url?: string }).url === "string" ? (value as { url: string }).url : "";
  if (!url) return null;
  return value as ClinicAttachment;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ reason: "id_ausente" }, { status: 400 });
  if (!(await paymentOwnedByUid(id, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const snap = await db.collection("payments").doc(id).get();
  if (!snap.exists) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const payment = mapPayment(snap.data()!, id);
  const wasPaid = payment.status === "pago";

  const body = (await request.json()) as {
    valor?: number;
    formaPagamento?: PaymentMethod;
    data?: string;
    observacao?: string;
    comprovante?: unknown;
  };
  const valor = typeof body.valor === "number" ? body.valor : Number(body.valor);
  const formaPagamento = (typeof body.formaPagamento === "string" ? body.formaPagamento : payment.formaPagamento) as PaymentMethod;
  const data = typeof body.data === "string" ? body.data : "";
  const observacao = typeof body.observacao === "string" ? body.observacao : "";
  const comprovante = mapAttachment(body.comprovante);

  let patch;
  try {
    patch = receiptPatch(payment, { valor, formaPagamento, data, observacao, comprovante });
  } catch (error) {
    const message = error instanceof Error ? error.message : "dados_invalidos";
    return NextResponse.json({ reason: message }, { status: 400 });
  }

  await db.collection("payments").doc(id).update({
    historico: patch.historico,
    valorAcordado: patch.valorAcordado,
    status: patch.status,
    paidAt: patch.paidAt,
    formaPagamento: patch.formaPagamento,
  });

  let emailAutomation: unknown = { skipped: "nao_aplicavel" };
  if (patch.status === "pago" && !wasPaid) {
    emailAutomation = await maybeSendPaymentConfirmationEmail(auth.uid, id);
  }

  return NextResponse.json({
    ok: true,
    status: patch.status,
    parcial: patch.parcial,
    emailAutomation,
  });
}
