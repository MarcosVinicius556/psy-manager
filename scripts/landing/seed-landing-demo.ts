/**
 * Idempotent extras for landing captures (run after seed-emulator.ts).
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { e2eFeedbackDocId } from "../../e2e/helpers/feedback-tokens";
import { startOfWeek, todayISO } from "../../src/lib/admin/format";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID || "demo-psy-manager";
const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";

initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

async function main() {
  const user = await auth.getUserByEmail(DEMO_EMAIL);
  const uid = user.uid;
  const now = new Date().toISOString();
  const weekStart = startOfWeek(todayISO());
  const month = todayISO().slice(0, 7);

  await db.doc(`users/${uid}`).set({ onboardingDismissed: true }, { merge: true });

  await db.collection("memberPrivate").doc(uid).set(
    {
      ownerUid: uid,
      cpf: "52998224725",
      crpNumero: "12345",
      crpRegiao: "06",
      enderecoLogradouro: "Rua das Flores, 120 — Sala 302",
      enderecoCidade: "Chapecó",
      enderecoUf: "SC",
      enderecoCep: "89801000",
      updatedAt: now,
    },
    { merge: true }
  );

  await db.collection("patients").doc("pat-ana").set(
    {
      nome: "Ana Souza",
      cpf: "11144477735",
      endereco: "Rua XV de Novembro, 450 — Centro",
      observacoes: "Prefere atendimento às manhãs.",
      status: "ativo",
      ownerUid: uid,
    },
    { merge: true }
  );

  const weekSlots = [
    { id: "appt-landing-0", day: 0, start: "09:00", end: "10:00", patientId: "pat-ana", modality: "presencial", status: "concluido", meet: false },
    { id: "appt-landing-1", day: 0, start: "11:00", end: "12:00", patientId: "pat-bruno", modality: "online", status: "agendado", meet: true },
    { id: "appt-landing-2", day: 1, start: "10:00", end: "11:00", patientId: "pat-ana", modality: "presencial", status: "concluido", meet: false },
    { id: "appt-landing-3", day: 1, start: "14:00", end: "15:00", patientId: "pat-ana", modality: "online", status: "agendado", meet: true },
    { id: "appt-landing-4", day: 2, start: "09:30", end: "10:30", patientId: "pat-bruno", modality: "presencial", status: "agendado", meet: false },
    { id: "appt-landing-5", day: 2, start: "15:00", end: "16:00", patientId: "pat-ana", modality: "presencial", status: "em_andamento", meet: false },
    { id: "appt-landing-6", day: 3, start: "08:00", end: "09:00", patientId: "pat-ana", modality: "online", status: "agendado", meet: true },
    { id: "appt-landing-7", day: 3, start: "16:00", end: "17:00", patientId: "pat-bruno", modality: "presencial", status: "agendado", meet: false },
    { id: "appt-landing-8", day: 4, start: "10:00", end: "11:00", patientId: "pat-ana", modality: "presencial", status: "agendado", meet: false },
    { id: "appt-landing-9", day: 4, start: "11:30", end: "12:30", patientId: "pat-ana", modality: "online", status: "agendado", meet: true },
  ];

  const evolucao =
    "Ana Souza relatou melhora no sono. Revisamos regulação emocional e tarefas de exposição gradual.";

  for (const slot of weekSlots) {
    const date = addDays(weekStart, slot.day);
    const clinical =
      slot.status === "concluido" && slot.patientId === "pat-ana"
        ? {
            mood: "estavel",
            approach: "tcc",
            evolucaoSessao: evolucao,
            intervencoes: "Psicoeducação e registro de pensamentos.",
            objetivos: "Reduzir ansiedade antecipatória.",
          }
        : {};
    await db.collection("appointments").doc(slot.id).set(
      {
        patientId: slot.patientId,
        date,
        startTime: slot.start,
        endTime: slot.end,
        modality: slot.modality,
        professionalId: uid,
        locationId: "loc-demo",
        sessionType: "padrao",
        valor: 200,
        valorSocial: false,
        status: slot.status,
        accessUids: [uid],
        ownerUid: uid,
        googleMeetLink: slot.meet ? "https://meet.google.com/psy-landing-demo" : null,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    if (slot.status === "concluido" && slot.patientId === "pat-ana") {
      await db.collection("clinicalRecords").doc(slot.id).set(
        {
          ownerUid: uid,
          patientId: slot.patientId,
          appointmentId: slot.id,
          clinical,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  }

  await db.collection("payments").doc("pay-landing-paid").set(
    {
      patientId: "pat-ana",
      descricao: "Sessão — Ana Souza",
      valor: 200,
      valorAcordado: 200,
      dueDate: `${month}-05`,
      status: "pago",
      paidAt: `${month}-05T15:00:00.000Z`,
      formaPagamento: "pix",
      ownerUid: uid,
      createdAt: now,
    },
    { merge: true }
  );
  await db.collection("payments").doc("pay-landing-open").set(
    {
      patientId: "pat-ana",
      descricao: "Próxima sessão — Ana Souza",
      valor: 200,
      valorAcordado: 200,
      dueDate: `${month}-18`,
      status: "agendado",
      formaPagamento: "pix",
      ownerUid: uid,
      createdAt: now,
    },
    { merge: true }
  );

  const feedbackExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const feedbackToken = e2eFeedbackDocId(1);
  await db.collection("sessionFeedbacks").doc(feedbackToken).set(
    {
      appointmentId: "appt-landing-0",
      patientId: "pat-ana",
      professionalNome: "Dra. Helena Alves",
      sessionDate: addDays(weekStart, 0),
      startTime: "09:00",
      ownerUid: uid,
      stars: null,
      comment: "",
      answeredAt: null,
      answeredAtMillis: null,
      expiresAt: feedbackExpires.toISOString(),
      expiresAtMillis: feedbackExpires.getTime(),
    },
    { merge: true }
  );

  const apptSnap = await db.collection("appointments").where("ownerUid", "==", uid).get();
  for (const doc of apptSnap.docs) {
    const data = doc.data();
    if (!Array.isArray(data.accessUids) || data.accessUids.length === 0) {
      await doc.ref.set({ accessUids: [uid], ownerUid: uid }, { merge: true });
    }
  }
  const locSnap = await db.collection("locations").where("ownerUid", "==", uid).get();
  for (const doc of locSnap.docs) {
    const data = doc.data();
    if (!Array.isArray(data.memberUids) || data.memberUids.length === 0) {
      await doc.ref.set({ memberUids: [uid], ownerUid: uid }, { merge: true });
    }
  }

  console.log(JSON.stringify({ ok: true, uid, weekStart }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
