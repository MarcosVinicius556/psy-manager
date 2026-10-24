/**
 * Dados extras para capturas da landing (emulador Firebase).
 * Rode após scripts/e2e/seed-emulator.ts.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { e2eFeedbackDocId } from "../../e2e/helpers/feedback-tokens";

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

function emptyClinical(evolucao: string) {
  return {
    mood: "estavel",
    approach: "tcc",
    templateId: "",
    sections: {},
    restrictedNote: "",
    clinicalEvolution: "",
    notes: "",
    aspectosCognitivos: "",
    aspectosEmocionais: "",
    intervencoes: "Psicoeducação sobre regulação emocional.",
    objetivos: "Reduzir ansiedade antecipatória.",
    evolucaoSessao: evolucao,
    anamneseArquivos: [],
    atividadesArquivos: [],
  };
}

async function main() {
  const user = await auth.getUserByEmail(DEMO_EMAIL);
  const uid = user.uid;
  const now = new Date().toISOString();

  await db.collection("members").doc(uid).set(
    {
      cpf: "52998224725",
      crpNumero: "12345",
      crpRegiao: "06",
      enderecoLogradouro: "Rua das Flores, 120 — Sala 302",
      enderecoCidade: "Chapecó",
      enderecoUf: "SC",
      enderecoCep: "89801000",
      reciboSequencia: 12,
    },
    { merge: true }
  );

  await db.collection("patients").doc("pat-ana").set(
    {
      cpf: "11144477735",
      cpfPagador: "11144477735",
      cpfBeneficiario: "11144477735",
      endereco: "Rua XV de Novembro, 450 — Centro",
      observacoes: "Prefere atendimento às manhãs. Contato de emergência: João Souza (pai).",
    },
    { merge: true }
  );

  for (let offset = -2; offset <= 4; offset += 1) {
    const date = isoDate(offset);
    const id = `appt-week-${offset}`;
    const isPast = offset < 0;
    await db.collection("appointments").doc(id).set({
      patientId: offset % 2 === 0 ? "pat-ana" : "pat-bruno",
      date,
      startTime: offset % 2 === 0 ? "10:00" : "14:00",
      endTime: offset % 2 === 0 ? "11:00" : "15:00",
      modality: offset === 1 ? "online" : "presencial",
      professionalId: "member-demo",
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
      status: isPast ? "concluido" : offset === 0 ? "em_andamento" : "agendado",
      clinical: isPast
        ? emptyClinical(
            "Ana Souza relatou melhora no sono e maior clareza sobre gatilhos de ansiedade. Revisamos tarefas de regulação emocional."
          )
        : emptyClinical(""),
      accessUids: [uid],
      ownerUid: uid,
      googleEventId: null,
      googleLocationEventId: null,
      googleMeetLink: offset === 1 ? "https://meet.google.com/demo-landing" : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection("payments").doc("pay-landing-paid").set({
    patientId: "pat-ana",
    appointmentId: "appt-week--2",
    packageId: null,
    origem: "paciente",
    recorrente: false,
    seriesId: null,
    descricao: "Sessão de psicoterapia — Ana Souza",
    valor: 200,
    valorAcordado: 200,
    dueDate: isoDate(-5),
    status: "pago",
    paidAt: `${isoDate(-2)}T14:30:00.000Z`,
    formaPagamento: "pix",
    historico: [
      {
        id: "evt-landing-1",
        tipo: "pagamento",
        data: isoDate(-2),
        valor: 200,
        formaPagamento: "pix",
        parcial: false,
        observacao: "PIX recebido",
        comprovante: null,
        createdAt: now,
      },
    ],
    reciboFiscal: null,
    ownerUid: uid,
    createdAt: now,
  });

  await db.collection("payments").doc("pay-1").set({ status: "agendado", ownerUid: uid }, { merge: true });
  await db.collection("payments").doc("pay-2").set({ status: "em_haver", ownerUid: uid }, { merge: true });

  const feedbackToken = e2eFeedbackDocId(1);
  await db.collection("sessionFeedbacks").doc(feedbackToken).set(
    {
      patientNome: "Ana Souza",
      professionalNome: "Dra. Helena Alves",
      sessionDate: isoDate(-2),
      startTime: "10:00",
      ownerUid: uid,
    },
    { merge: true }
  );

  console.log(JSON.stringify({ ok: true, uid, feedbackPath: `/feedback/${feedbackToken}` }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
