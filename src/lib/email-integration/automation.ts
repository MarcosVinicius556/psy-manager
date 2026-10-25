import { getAdminDb } from "@/lib/firebase-admin";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { claimAutomationSend, paymentConfirmationMarkerId } from "./idempotency";
import { sendProfessionalEmail, userEmailConnected } from "./send-service";
import type { EmailTemplate } from "./types";

function mapEmailTemplate(id: string, data: FirebaseFirestore.DocumentData): EmailTemplate | null {
  const nome = typeof data.nome === "string" ? data.nome : "";
  if (!nome) return null;
  return {
    id,
    nome,
    trigger: (typeof data.trigger === "string" ? data.trigger : "livre") as EmailTemplate["trigger"],
    assunto: typeof data.assunto === "string" ? data.assunto : "",
    corpo: typeof data.corpo === "string" ? data.corpo : "",
    anexo: (typeof data.anexo === "string" ? data.anexo : "nenhum") as EmailTemplate["anexo"],
    autoSend: Boolean(data.autoSend),
    arquivado: Boolean(data.arquivado),
    versao: Number(data.versao) || 1,
    historico: [],
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
  };
}

export async function maybeSendPaymentConfirmationEmail(ownerUid: string, paymentId: string) {
  if (!(await userEmailConnected(ownerUid))) return { skipped: "nao_conectado" };

  const db = getAdminDb();
  if (!db) return { skipped: "firebase_admin" };

  const marker = paymentConfirmationMarkerId(paymentId);
  const claim = await claimAutomationSend(marker, ownerUid);
  if (!claim.claimed) return { skipped: claim.reason };

  const paymentSnap = await db.collection("payments").doc(paymentId).get();
  if (!paymentSnap.exists || paymentSnap.data()?.ownerUid !== ownerUid) return { skipped: "pagamento" };
  const payment = paymentSnap.data()!;
  if (payment.status !== "pago") return { skipped: "status" };

  const templatesSnap = await db.collection("emailTemplates").where("ownerUid", "==", ownerUid).get();

  const templateDoc = templatesSnap.docs.find((doc) => {
    const data = doc.data();
    return (
      data.trigger === "confirmacao_pagamento" &&
      data.arquivado !== true &&
      data.autoSend === true
    );
  });
  if (!templateDoc) return { skipped: "auto_desligado" };
  const template = mapEmailTemplate(templateDoc.id, templateDoc.data());
  if (!template) return { skipped: "template" };

  const patientId = typeof payment.patientId === "string" ? payment.patientId : "";
  if (!patientId) return { skipped: "paciente" };
  const patientSnap = await db.collection("patients").doc(patientId).get();
  const patientEmail = typeof patientSnap.data()?.email === "string" ? patientSnap.data()!.email.trim().toLowerCase() : "";
  const patientNome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";
  if (!patientEmail) return { skipped: "email_paciente" };

  const memberSnap = await db.collection("members").where("uid", "==", ownerUid).limit(1).get();
  const profissionalNome =
    typeof memberSnap.docs[0]?.data()?.nome === "string" ? memberSnap.docs[0].data()!.nome : "Profissional";

  const valor = typeof payment.valorAcordado === "number" ? formatMoney(payment.valorAcordado) : "";

  try {
    await sendProfessionalEmail({
      ownerUid,
      to: patientEmail,
      subjectTemplate: template.assunto,
      bodyTemplate: template.corpo,
      context: {
        paciente_nome: patientNome,
        profissional_nome: profissionalNome,
        descricao: typeof payment.descricao === "string" ? payment.descricao : "Sessão",
        valor,
        data_pagamento: formatDate((payment.paidAt || payment.createdAt || "").slice(0, 10)),
      },
      templateId: template.id,
      templateNome: template.nome,
      patientId,
      paymentId,
      relatedType: "payment",
      relatedId: paymentId,
    });
    return { sent: true };
  } catch {
    return { skipped: "falha_envio" };
  }
}
