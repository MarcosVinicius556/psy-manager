/**
 * Dados extras para capturas da landing (emulador Firebase).
 * Rode após scripts/e2e/seed-emulator.ts.
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

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

const TEMPLATE_ID = "tpl-landing-tcc";

function richClinical(evolucao: string) {
  return {
    mood: "estavel",
    approach: "tcc",
    templateId: TEMPLATE_ID,
    sections: {
      queixa: "Ansiedade em contextos sociais e dificuldade para iniciar o sono.",
      intervencao: "Reestruturação cognitiva e registro de pensamentos automáticos.",
    },
    restrictedNote: "",
    clinicalEvolution: evolucao,
    notes: "Paciente colaborativa e engajada nas tarefas de casa.",
    aspectosCognitivos: "Pensamentos catastróficos sobre avaliação social.",
    aspectosEmocionais: "Ansiedade moderada, humor estável.",
    intervencoes: "Psicoeducação sobre regulação emocional e exposição gradual.",
    objetivos: "Reduzir ansiedade antecipatória e melhorar higiene do sono.",
    evolucaoSessao: evolucao,
    anamneseArquivos: [],
    atividadesArquivos: [],
  };
}

async function main() {
  const user = await auth.getUserByEmail(DEMO_EMAIL);
  const uid = user.uid;
  const now = new Date().toISOString();
  const trialEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;

  await db.doc(`users/${uid}`).set(
    {
      onboardingDismissed: true,
      trialEndsAtMillis: trialEnd,
      trialEndsAt: new Date(trialEnd).toISOString(),
      subscriptionStatus: "trial_ativo",
      billingAccess: "trial",
      accountStatus: "ativa",
      updatedAt: now,
    },
    { merge: true }
  );

  const memberPrivate = {
    ownerUid: uid,
    cpf: "52998224725",
    crpNumero: "12345",
    crpRegiao: "06",
    enderecoLogradouro: "Rua das Flores, 120 — Sala 302",
    enderecoCidade: "Chapecó",
    enderecoUf: "SC",
    enderecoCep: "89801000",
    updatedAt: now,
  };
  await db.collection("memberPrivate").doc(uid).set(memberPrivate, { merge: true });

  const memberPublic = {
    uid,
    ownerUid: uid,
    email: DEMO_EMAIL,
    nome: "Dra. Helena Alves",
    telefone: "49999826688",
    foto: "",
    valorBase: 200,
    valorSocial: 120,
    workHours: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "08:00", endTime: "19:00" })),
    ativo: true,
    reciboSequencia: 12,
    createdAt: now,
  };
  await db.collection("members").doc(uid).set(memberPublic, { merge: true });
  await db.collection("members").doc("member-demo").set({ ...memberPublic, uid }, { merge: true });

  await db.collection("locations").doc("loc-demo").set(
    {
      nome: "Consultório Centro",
      endereco: "Rua das Flores, 120 — Centro",
      observacoes: "Sala 302",
      memberIds: [uid, "member-demo"],
      memberUids: [uid],
      createdByUid: uid,
      ownerUid: uid,
      createdAt: now,
    },
    { merge: true }
  );

  await db.collection("patients").doc("pat-ana").set(
    {
      nome: "Ana Souza",
      telefone: "49999112233",
      email: "ana@example.test",
      cpf: "11144477735",
      cpfPagador: "11144477735",
      cpfBeneficiario: "11144477735",
      nascimento: "1998-03-14",
      endereco: "Rua XV de Novembro, 450 — Centro",
      observacoes: "Prefere atendimento às manhãs. Contato de emergência: João Souza (pai).",
      status: "ativo",
      ownerUid: uid,
      createdAt: now,
    },
    { merge: true }
  );

  await db.collection("clinicalNoteTemplates").doc(TEMPLATE_ID).set({
    ownerUid: uid,
    nome: "Evolução TCC — sessão",
    approach: "tcc",
    sections: [
      { key: "queixa", label: "Queixa principal", mapTo: "notes" },
      { key: "intervencao", label: "Intervenções", mapTo: "intervencoes" },
    ],
    createdAt: now,
    updatedAt: now,
  });

  const weekStart = startOfWeek(todayISO());
  const weekSlots = [
    { day: 0, start: "09:00", end: "10:00", patientId: "pat-ana", modality: "presencial", status: "concluido", past: true },
    { day: 0, start: "11:00", end: "12:00", patientId: "pat-bruno", modality: "online", status: "agendado", meet: true },
    { day: 1, start: "10:00", end: "11:00", patientId: "pat-ana", modality: "presencial", status: "concluido", past: true },
    { day: 1, start: "14:00", end: "15:00", patientId: "pat-ana", modality: "online", status: "agendado", meet: true },
    { day: 2, start: "09:30", end: "10:30", patientId: "pat-bruno", modality: "presencial", status: "agendado" },
    { day: 2, start: "15:00", end: "16:00", patientId: "pat-ana", modality: "presencial", status: "em_andamento" },
    { day: 3, start: "08:00", end: "09:00", patientId: "pat-ana", modality: "online", status: "agendado", meet: true },
    { day: 3, start: "16:00", end: "17:00", patientId: "pat-bruno", modality: "presencial", status: "agendado" },
    { day: 4, start: "10:00", end: "11:00", patientId: "pat-ana", modality: "presencial", status: "agendado" },
    { day: 4, start: "11:30", end: "12:30", patientId: "pat-ana", modality: "online", status: "agendado", meet: true },
  ];

  for (const [index, slot] of weekSlots.entries()) {
    const date = addDays(weekStart, slot.day);
    const id = `appt-landing-week-${index}`;
    const isPast = slot.past === true;
    const evolucao =
      "Ana Souza relatou melhora no sono e maior clareza sobre gatilhos de ansiedade. Revisamos tarefas de regulação emocional e combinamos exposição gradual em contexto social.";
    const clinical = isPast && slot.patientId === "pat-ana" ? richClinical(evolucao) : richClinical("");

    await db.collection("appointments").doc(id).set({
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
      packageId: null,
      packageVersao: null,
      creditoEmHaver: false,
      faltaJustificativa: "",
      recurring: false,
      seriesId: null,
      status: slot.status,
      clinical: isPast ? clinical : {},
      accessUids: [uid],
      ownerUid: uid,
      googleEventId: null,
      googleLocationEventId: null,
      googleMeetLink: slot.meet ? "https://meet.google.com/psy-landing-demo" : null,
      createdAt: now,
      updatedAt: now,
    });

    if (isPast && slot.patientId === "pat-ana") {
      await db.collection("clinicalRecords").doc(id).set({
        ownerUid: uid,
        patientId: slot.patientId,
        appointmentId: id,
        clinical,
        updatedAt: now,
      });
    }
  }

  const month = todayISO().slice(0, 7);
  const paymentRows = [
    { id: "pay-landing-paid", patientId: "pat-ana", status: "pago", due: `${month}-05`, valor: 200, desc: "Sessão — Ana Souza" },
    { id: "pay-landing-paid-2", patientId: "pat-bruno", status: "pago", due: `${month}-08`, valor: 200, desc: "Sessão — Bruno Lima" },
    { id: "pay-landing-open", patientId: "pat-ana", status: "agendado", due: `${month}-18`, valor: 200, desc: "Próxima sessão — Ana Souza" },
    { id: "pay-landing-haver", patientId: "pat-bruno", status: "em_haver", due: `${month}-12`, valor: 160, desc: "Pacote quinzenal" },
  ];

  for (const row of paymentRows) {
    const paid = row.status === "pago";
    await db.collection("payments").doc(row.id).set({
      patientId: row.patientId,
      appointmentId: null,
      packageId: null,
      origem: "paciente",
      recorrente: false,
      seriesId: null,
      descricao: row.desc,
      valor: row.valor,
      valorAcordado: row.valor,
      dueDate: row.due,
      status: row.status,
      paidAt: paid ? `${row.due}T15:00:00.000Z` : null,
      formaPagamento: "pix",
      historico: paid
        ? [
            {
              id: `evt-${row.id}`,
              tipo: "pagamento",
              data: row.due,
              valor: row.valor,
              formaPagamento: "pix",
              parcial: false,
              observacao: "PIX recebido",
              comprovante: null,
              createdAt: now,
            },
          ]
        : [],
      reciboFiscal: null,
      ownerUid: uid,
      createdAt: now,
    });
  }

  await db.collection("payments").doc("pay-1").set(
    { status: "agendado", dueDate: `${month}-22`, ownerUid: uid, patientId: "pat-ana", descricao: "Sessão avulsa" },
    { merge: true }
  );

  const feedbackToken = e2eFeedbackDocId(1);
  await db.collection("sessionFeedbacks").doc(feedbackToken).set(
    {
      appointmentId: "appt-landing-week-0",
      patientId: "pat-ana",
      patientNome: "Ana Souza",
      professionalNome: "Dra. Helena Alves",
      sessionDate: addDays(weekStart, 0),
      startTime: "09:00",
      ownerUid: uid,
      stars: null,
      comment: "",
      answeredAt: null,
      createdAt: now,
    },
    { merge: true }
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        uid,
        weekStart,
        appointments: weekSlots.length,
        feedbackPath: `/feedback/${feedbackToken}`,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
