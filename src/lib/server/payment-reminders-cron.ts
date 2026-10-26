import type { Firestore } from "firebase-admin/firestore";
import { formatDate } from "@/lib/admin/format";
import { remainingAmount } from "@/lib/admin/finance";
import { mapPayment } from "@/lib/admin/collections";
import { buildPaymentPixBrcode, memberPixProfile } from "@/lib/pix/build-charge";
import { pixProfileReady } from "@/lib/pix/keys";
import { claimAutomationSend } from "@/lib/email-integration/idempotency";
import { sendProfessionalEmail, userEmailConnected } from "@/lib/email-integration/send-service";
import type { EmailTemplate } from "@/lib/email-integration/types";
import { paymentReminderMarkerId, paymentReminderStage } from "@/lib/billing/subscription-pix";
import { reminderUnsubscribeToken } from "./session-confirmation";
import { getSiteUrl } from "@/lib/site";

const BATCH = 120;

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

export async function runPaymentRemindersCron(db: Firestore, now = Date.now(), cursor: string | null = null) {
  const today = new Date(now).toISOString().slice(0, 10);
  const site = getSiteUrl();

  let query = db.collection("payments").orderBy("__name__").limit(BATCH);
  if (cursor) {
    const cursorSnap = await db.collection("payments").doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  let processed = 0;
  let emailsSent = 0;
  let lastId: string | null = null;

  for (const docSnap of snapshot.docs) {
    lastId = docSnap.id;
    const payment = mapPayment(docSnap.id, docSnap.data());
    const remaining = remainingAmount(payment);
    if (remaining <= 0 || payment.status === "pago") continue;
    if (payment.status !== "nao_pago" && payment.status !== "em_haver" && payment.status !== "agendado") continue;

    const lembretesEnviados = typeof docSnap.data().lembretesEnviados === "number" ? docSnap.data().lembretesEnviados : 0;
    const stage = paymentReminderStage(payment.dueDate, today, lembretesEnviados);
    if (!stage) continue;

    const ownerUid = typeof docSnap.data().ownerUid === "string" ? docSnap.data().ownerUid : "";
    const patientId = payment.patientId;
    if (!ownerUid || !patientId) continue;

    const marker = paymentReminderMarkerId(payment.id, stage);
    const claim = await claimAutomationSend(marker, ownerUid);
    if (!claim.claimed) continue;

    processed += 1;

    const patientSnap = await db.collection("patients").doc(patientId).get();
    const patient = patientSnap.data() || {};
    if (patient.lembretesEmail === false) continue;

    const patientEmail = typeof patient.email === "string" ? patient.email.trim().toLowerCase() : "";
    const patientNome = typeof patient.nome === "string" ? patient.nome : "";
    if (!patientEmail) continue;

    if (!(await userEmailConnected(ownerUid))) continue;

    const templatesSnap = await db.collection("emailTemplates").where("ownerUid", "==", ownerUid).get();
    const templateDoc = templatesSnap.docs.find((item) => {
      const data = item.data();
      return (data.trigger === "cobranca_pix" || data.trigger === "cobranca") && data.arquivado !== true && data.autoSend === true;
    });
    if (!templateDoc) continue;
    const template = mapEmailTemplate(templateDoc.id, templateDoc.data());
    if (!template) continue;

    const memberSnap = await db.collection("members").where("ownerUid", "==", ownerUid).limit(1).get();
    const memberData = memberSnap.docs[0]?.data();
    const privateSnap = memberSnap.docs[0]
      ? await db.collection("memberPrivate").doc(memberSnap.docs[0].id).get()
      : null;
    const mergedMember = {
      ...(memberData || {}),
      ...(privateSnap?.data() || {}),
      uid: ownerUid,
      nome: typeof memberData?.nome === "string" ? memberData.nome : "Profissional",
    };
    const profile = memberPixProfile(mergedMember as Parameters<typeof memberPixProfile>[0]);
    if (!pixProfileReady(profile).ok) continue;

    const pix = buildPaymentPixBrcode(mergedMember as Parameters<typeof buildPaymentPixBrcode>[0], payment);
    if (!pix.ok) continue;

    const profissionalNome = mergedMember.nome;
    const unsubscribeToken = reminderUnsubscribeToken(ownerUid, patientId);
    const unsubscribeUrl = `${site}/api/public/reminders-unsubscribe?ownerUid=${encodeURIComponent(ownerUid)}&patientId=${encodeURIComponent(patientId)}&token=${encodeURIComponent(unsubscribeToken)}`;

    const userSnap = await db.collection("users").doc(ownerUid).get();
    const clinicaNome = typeof userSnap.data()?.clinicName === "string" ? userSnap.data()!.clinicName : "Consultório";

    try {
      await sendProfessionalEmail({
        ownerUid,
        to: patientEmail,
        subjectTemplate: template.assunto,
        bodyTemplate: template.corpo,
        context: {
          paciente_nome: patientNome,
          profissional_nome: profissionalNome,
          clinica_nome: clinicaNome,
          valor: remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          vencimento: formatDate(payment.dueDate),
          pix_copia_cola: pix.code,
          link_descadastro: unsubscribeUrl,
        },
        templateId: template.id,
        templateNome: template.nome,
        patientId,
        relatedType: "payment",
        relatedId: payment.id,
      });
      emailsSent += 1;
      await docSnap.ref.set(
        { lembretesEnviados: lembretesEnviados + 1, updatedAt: new Date(now).toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error("payment_reminders: falha ao enviar", payment.id, error);
      await db.collection("emailAutomationMarkers").doc(marker).delete();
    }
  }

  const partial = snapshot.size >= BATCH;
  return {
    processed,
    emailsSent,
    cursor: partial && lastId ? lastId : null,
    day: today,
  };
}
