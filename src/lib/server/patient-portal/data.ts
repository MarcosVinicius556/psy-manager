import type { Firestore } from "firebase-admin/firestore";
import { remainingAmount } from "@/lib/admin/finance";
import { mapPayment } from "@/lib/admin/collections";
import type { ClinicAttachment, Mood } from "@/lib/admin/types";
import { buildPaymentPixBrcode } from "@/lib/pix/build-charge";
import { decryptFormResponses } from "@/lib/server/form-response-store";
import { isScaleTemplateId } from "@/lib/scales/catalog";
import type { PatientAccountLink, PatientHomeworkTask, PatientJournalEntry, PatientMuralMessage } from "./types";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

type PatientAppointmentRow = {
  id: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: "online" | "presencial";
  status: string;
  googleMeetLink: string;
  confirmacao: string;
};

function mapAppointment(id: string, data: FirebaseFirestore.DocumentData): PatientAppointmentRow {
  return {
    id,
    patientId: text(data.patientId),
    date: text(data.date),
    startTime: text(data.startTime),
    endTime: text(data.endTime),
    modality: text(data.modality) === "online" ? "online" : "presencial",
    status: text(data.status) || "agendado",
    googleMeetLink: text(data.googleMeetLink),
    confirmacao: text(data.confirmacao) || "pendente",
  };
}

export async function listPatientAppointments(db: Firestore, link: PatientAccountLink) {
  const snap = await db.collection("appointments").where("ownerUid", "==", link.ownerUid).get();
  const items = snap.docs
    .map((doc) => mapAppointment(doc.id, doc.data()))
    .filter((item) => item.patientId === link.patientId)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  return items.map((item) => ({
    id: item.id,
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    modality: item.modality,
    status: item.status,
    confirmacao: item.confirmacao,
    googleMeetLink: item.googleMeetLink || null,
  }));
}

export async function confirmPatientAppointment(
  db: Firestore,
  link: PatientAccountLink,
  appointmentId: string,
  next: "confirmada" | "remarcar"
) {
  const ref = db.collection("appointments").doc(appointmentId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const, reason: "nao_encontrado" };
  const data = snap.data() || {};
  if (data.ownerUid !== link.ownerUid || data.patientId !== link.patientId) {
    return { ok: false as const, reason: "sem_permissao" };
  }
  if (text(data.status) !== "agendado") {
    return { ok: false as const, reason: "status_invalido" };
  }
  const stamp = new Date().toISOString();
  await ref.update({ confirmacao: next, confirmadaEm: stamp, updatedAt: stamp });
  return { ok: true as const };
}

export async function listPatientPaymentsWithPix(db: Firestore, link: PatientAccountLink) {
  const memberSnap = await db.collection("members").doc(link.ownerUid).get();
  const memberData = memberSnap.exists ? memberSnap.data()! : {};
  const member = {
    id: link.ownerUid,
    uid: link.ownerUid,
    nome: text(memberData.nome) || "Profissional",
    email: text(memberData.email),
    telefone: text(memberData.telefone),
    foto: text(memberData.foto),
    cpf: text(memberData.cpf),
    crpNumero: text(memberData.crpNumero),
    crpRegiao: text(memberData.crpRegiao),
    enderecoLogradouro: text(memberData.enderecoLogradouro),
    enderecoCidade: text(memberData.enderecoCidade),
    enderecoUf: text(memberData.enderecoUf),
    enderecoCep: text(memberData.enderecoCep),
    pixChave: text(memberData.pixChave),
    pixTipo: (text(memberData.pixTipo) || "") as import("@/lib/admin/types").PixKeyType,
    pixNome: text(memberData.pixNome),
    pixCidade: text(memberData.pixCidade),
    reciboSequencia: Number(memberData.reciboSequencia) || 0,
    valorBase: Number(memberData.valorBase) || 0,
    valorSocial: Number(memberData.valorSocial) || 0,
    workHours: [],
    contratoModelo: text(memberData.contratoModelo),
    ativo: memberData.ativo !== false,
    createdAt: text(memberData.createdAt),
  };

  const snap = await db.collection("payments").where("ownerUid", "==", link.ownerUid).get();
  return snap.docs
    .map((doc) => mapPayment(doc.id, doc.data()))
    .filter((p) => p.patientId === link.patientId && p.origem === "paciente")
    .filter((p) => remainingAmount(p) > 0 && p.status !== "pago")
    .map((payment) => {
      const pix = buildPaymentPixBrcode(member, payment);
      return {
        id: payment.id,
        descricao: payment.descricao,
        dueDate: payment.dueDate,
        valorRestante: remainingAmount(payment),
        status: payment.status,
        pix: pix.ok ? { code: pix.code, txid: pix.txid } : { error: pix.reason },
      };
    });
}

export async function listPatientReceipts(db: Firestore, link: PatientAccountLink) {
  const snap = await db.collection("payments").where("ownerUid", "==", link.ownerUid).get();
  const receipts: { paymentId: string; descricao: string; emitidoEm: string; numero: number }[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.patientId !== link.patientId) continue;
    const payment = mapPayment(doc.id, data);
    const fiscal = payment.reciboFiscal;
    if (!fiscal) continue;
    const numero = fiscal.numero;
    const emitidoEm = fiscal.emitidoEm;
    if (!numero || !emitidoEm) continue;
    receipts.push({
      paymentId: doc.id,
      descricao: payment.descricao,
      emitidoEm,
      numero,
    });
  }
  return receipts.sort((a, b) => b.emitidoEm.localeCompare(a.emitidoEm));
}

export async function listPatientPendingDocuments(db: Firestore, link: PatientAccountLink) {
  const now = Date.now();
  const pending: { kind: "assinatura" | "formulario"; token: string; title: string; expiresAt: string }[] = [];

  const signatures = await db.collection("signatureRequests").where("ownerUid", "==", link.ownerUid).get();
  for (const doc of signatures.docs) {
    const data = doc.data();
    if (data.patientId !== link.patientId) continue;
    if (data.signedAt || data.signedAtMillis) continue;
    const expires = Number(data.expiresAtMillis) || 0;
    if (expires && expires <= now) continue;
    pending.push({
      kind: "assinatura",
      token: doc.id,
      title: text(data.title) || "Documento para assinar",
      expiresAt: text(data.expiresAt),
    });
  }

  const forms = await db.collection("formRequests").where("ownerUid", "==", link.ownerUid).get();
  for (const doc of forms.docs) {
    const data = doc.data();
    if (data.patientId !== link.patientId) continue;
    if (data.answeredAt || data.answeredAtMillis) continue;
    const expires = Number(data.expiresAtMillis) || 0;
    if (expires && expires <= now) continue;
    pending.push({
      kind: "formulario",
      token: doc.id,
      title: text(data.templateNome) || "Formulário",
      expiresAt: text(data.expiresAt),
    });
  }

  return pending;
}

export async function listJournalEntries(db: Firestore, link: PatientAccountLink, sharedOnly = false) {
  const snap = await db.collection("patientJournal").where("patientUid", "==", link.uid).get();
  const entries: PatientJournalEntry[] = snap.docs
    .map((doc) => {
      const data = doc.data();
      const comentarios = Array.isArray(data.comentarios)
        ? data.comentarios.map((item: Record<string, unknown>, index: number) => ({
            id: text(item.id) || `c${index}`,
            texto: text(item.texto),
            createdAt: text(item.createdAt),
            authorUid: text(item.authorUid),
          }))
        : [];
      return {
        id: doc.id,
        dia: text(data.dia),
        humor: (text(data.humor) || "") as Mood | "",
        texto: text(data.texto),
        compartilhado: Boolean(data.compartilhado),
        comentarios,
        createdAt: text(data.createdAt),
        updatedAt: text(data.updatedAt),
      };
    })
    .filter((item) => !sharedOnly || item.compartilhado)
    .sort((a, b) => b.dia.localeCompare(a.dia));
  return entries;
}

export async function upsertJournalEntry(
  db: Firestore,
  link: PatientAccountLink,
  input: { dia: string; humor: Mood | ""; texto: string; compartilhado: boolean }
) {
  const existing = await db
    .collection("patientJournal")
    .where("patientUid", "==", link.uid)
    .where("dia", "==", input.dia)
    .limit(1)
    .get();

  const now = new Date().toISOString();
  if (!existing.empty) {
    const ref = existing.docs[0].ref;
    await ref.update({
      humor: input.humor,
      texto: input.texto.slice(0, 4000),
      compartilhado: input.compartilhado,
      updatedAt: now,
    });
    return ref.id;
  }

  const created = await db.collection("patientJournal").add({
    ownerUid: link.ownerUid,
    patientId: link.patientId,
    patientUid: link.uid,
    dia: input.dia,
    humor: input.humor,
    texto: input.texto.slice(0, 4000),
    compartilhado: input.compartilhado,
    comentarios: [],
    createdAt: now,
    updatedAt: now,
  });
  return created.id;
}

export async function listHomeworkTasks(db: Firestore, link: PatientAccountLink) {
  const snap = await db.collection("patientTasks").where("patientId", "==", link.patientId).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      if (data.ownerUid !== link.ownerUid) return null;
      return {
        id: doc.id,
        titulo: text(data.titulo),
        prazo: text(data.prazo) || null,
        concluidaEm: text(data.concluidaEm) || null,
        createdAt: text(data.createdAt),
      } satisfies PatientHomeworkTask;
    })
    .filter((item): item is PatientHomeworkTask => Boolean(item))
    .sort((a, b) => (a.prazo || a.createdAt).localeCompare(b.prazo || b.createdAt));
}

export async function completeHomeworkTask(db: Firestore, link: PatientAccountLink, taskId: string) {
  const ref = db.collection("patientTasks").doc(taskId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (data.ownerUid !== link.ownerUid || data.patientId !== link.patientId) return false;
  await ref.update({ concluidaEm: new Date().toISOString() });
  return true;
}

export async function listMuralMessages(db: Firestore, link: PatientAccountLink) {
  const snap = await db.collection("patientMural").where("patientId", "==", link.patientId).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      if (data.ownerUid !== link.ownerUid) return null;
      return {
        id: doc.id,
        texto: text(data.texto),
        createdAt: text(data.createdAt),
      } satisfies PatientMuralMessage;
    })
    .filter((item): item is PatientMuralMessage => Boolean(item))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listScaleSeries(db: Firestore, link: PatientAccountLink, templateId: string) {
  const snap = await db.collection("formResponses").where("patientId", "==", link.patientId).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      if (data.ownerUid !== link.ownerUid) return null;
      if (text(data.templateId) !== templateId) return null;
      if (!isScaleTemplateId(templateId)) return null;
      const pontuacao = Number(data.pontuacao);
      const submittedAt = text(data.submittedAt);
      if (!Number.isFinite(pontuacao) || !submittedAt) return null;
      return { submittedAt, pontuacao, faixa: text(data.faixa) };
    })
    .filter((item): item is { submittedAt: string; pontuacao: number; faixa: string } => Boolean(item))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export async function psychologistInsights(db: Firestore, ownerUid: string, patientId: string) {
  const journalSnap = await db
    .collection("patientJournal")
    .where("ownerUid", "==", ownerUid)
    .where("patientId", "==", patientId)
    .get();
  const shared = journalSnap.docs
    .map((doc) => {
      const data = doc.data();
      if (!data.compartilhado) return null;
      return {
        id: doc.id,
        dia: text(data.dia),
        humor: text(data.humor),
        texto: text(data.texto),
        updatedAt: text(data.updatedAt),
      };
    })
    .filter(Boolean) as { id: string; dia: string; humor: string; texto: string; updatedAt: string }[];

  const scaleSeries: Record<string, { submittedAt: string; pontuacao: number; faixa: string }[]> = {};
  const responses = await db.collection("formResponses").where("patientId", "==", patientId).get();
  for (const doc of responses.docs) {
    const data = doc.data();
    if (data.ownerUid !== ownerUid) continue;
    const templateId = text(data.templateId);
    if (!isScaleTemplateId(templateId)) continue;
    const pontuacao = Number(data.pontuacao);
    const submittedAt = text(data.submittedAt);
    if (!Number.isFinite(pontuacao) || !submittedAt) continue;
    scaleSeries[templateId] = scaleSeries[templateId] || [];
    scaleSeries[templateId].push({ submittedAt, pontuacao, faixa: text(data.faixa) });
  }
  for (const key of Object.keys(scaleSeries)) {
    scaleSeries[key].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  }

  return { journal: shared.sort((a, b) => b.dia.localeCompare(a.dia)), scaleSeries };
}

export function mapAttachment(data: unknown): ClinicAttachment | null {
  if (!data || typeof data !== "object") return null;
  const item = data as Record<string, unknown>;
  const id = text(item.id);
  const nome = text(item.nome);
  if (!id || !nome) return null;
  return {
    id,
    nome,
    mime: text(item.mime),
    url: text(item.url) || undefined,
  };
}

export async function listFormResponsesForPsychologist(db: Firestore, ownerUid: string, patientId: string) {
  const snap = await db.collection("formResponses").where("patientId", "==", patientId).get();
  return snap.docs
    .filter((doc) => doc.data().ownerUid === ownerUid)
    .map((doc) => {
      const data = doc.data();
      const respostas = decryptFormResponses(data);
      return {
        id: doc.id,
        templateId: text(data.templateId),
        submittedAt: text(data.submittedAt),
        pontuacao: Number(data.pontuacao) || null,
        faixa: text(data.faixa) || null,
        respostas,
      };
    });
}
