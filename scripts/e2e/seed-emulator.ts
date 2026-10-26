/**
 * Popula Auth + Firestore emuladores com conta demo para testes mobile (e2e).
 * Uso: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npx tsx scripts/e2e/seed-emulator.ts
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { LEGAL_DOCUMENTS } from "../../src/lib/legal/config";
import { hashLegalContent } from "../../src/lib/legal/hash";
import { e2eFeedbackDocId } from "../../e2e/helpers/feedback-tokens";
import { buildTrialAccount } from "../../src/lib/saas/model";

async function seedLegalAcceptances(uid: string) {
  const docs = ["termos", "privacidade", "dpa"] as const;
  for (const document of docs) {
    const meta = LEGAL_DOCUMENTS[document];
    await db.collection("legalAcceptances").add({
      uid,
      document,
      version: meta.version,
      contentHash: hashLegalContent(meta.acceptanceSource),
      acceptedAt: new Date().toISOString(),
      ip: "127.0.0.1",
      userAgent: "e2e-seed",
    });
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID || "demo-psy-manager";
const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const PLATFORM_EMAIL = process.env.E2E_PLATFORM_EMAIL || "platform@psy.test";
const PLATFORM_PASSWORD = process.env.E2E_PLATFORM_PASSWORD || "Platform123456!";

initializeApp({ projectId });

const auth = getAuth();
const db = getFirestore();

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(DEMO_EMAIL);
  } catch {
    user = await auth.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, displayName: "Dra. Helena Alves" });
  }

  const uid = user.uid;
  await auth.updateUser(uid, { emailVerified: true, displayName: "Dra. Helena Alves" });
  const now = new Date().toISOString();
  const trial = buildTrialAccount({
    uid,
    email: DEMO_EMAIL,
    nome: "Dra. Helena Alves",
    clinicName: "Consultório Centro",
    now: Date.now(),
    termsAcceptedAt: now,
  });

  await db.doc(`users/${uid}`).set(
    {
      ...trial,
      role: "psicologo",
      billingAccess: "legado",
      subscriptionStatus: "legado",
      onboardingDismissed: true,
    },
    { merge: true }
  );

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
  await seedLegalAcceptances(uid);
  await db.doc(`trialClaims/${DEMO_EMAIL}`).set({
    email: DEMO_EMAIL,
    uid,
    ownerUid: uid,
    createdAt: now,
  });

  const memberPayload = {
    uid,
    ownerUid: uid,
    email: DEMO_EMAIL,
    nome: "Dra. Helena Alves",
    telefone: "49999826688",
    foto: "",
    valorBase: 200,
    valorSocial: 120,
    workHours: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "09:00", endTime: "18:00" })),
    ativo: true,
    createdAt: now,
  };

  await db.collection("members").doc(uid).set(memberPayload, { merge: true });

  const locationRef = db.collection("locations").doc("loc-demo");
  await locationRef.set({
    nome: "Consultório Centro",
    endereco: "Rua das Flores, 120 — Centro",
    observacoes: "Sala 302",
    memberIds: [uid],
    memberUids: [uid],
    createdByUid: uid,
    ownerUid: uid,
    createdAt: now,
  });

  const patients = [
    { id: "pat-ana", nome: "Ana Souza", telefone: "49999112233", email: "ana@example.test" },
    { id: "pat-bruno", nome: "Bruno Lima", telefone: "49999223344", email: "bruno@example.test" },
    {
      id: "pat-teste",
      nome: "Paciente Para Teste",
      telefone: "49999826688",
      email: "marcosvinicios4132@gmail.com",
    },
  ];

  for (const patient of patients) {
    await db.collection("patients").doc(patient.id).set({
      ...patient,
      cpf: "",
      nascimento: "1990-05-12",
      endereco: "",
      contatoEmergencia: "",
      observacoes: "",
      foto: "",
      contratoAssinado: null,
      status: "ativo",
      ownerUid: uid,
      createdAt: now,
    });
  }

  const appointmentBase = {
    valorSocial: false,
    packageId: null,
    packageVersao: null,
    creditoEmHaver: false,
    faltaJustificativa: "",
    recurring: false,
    seriesId: null,
    clinical: {},
    accessUids: [uid],
    ownerUid: uid,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("appointments").doc("appt-1").set({
    patientId: "pat-ana",
    date: isoDate(0),
    startTime: "10:00",
    endTime: "11:00",
    modality: "presencial",
    professionalId: uid,
    locationId: "loc-demo",
    sessionType: "padrao",
    valor: 200,
    status: "agendado",
    ...appointmentBase,
  });

  await db.collection("appointments").doc("appt-2").set({
    patientId: "pat-bruno",
    date: isoDate(1),
    startTime: "14:00",
    endTime: "15:00",
    modality: "online",
    professionalId: uid,
    locationId: "loc-demo",
    sessionType: "padrao",
    valor: 200,
    status: "agendado",
    ...appointmentBase,
  });

  await db.collection("payments").doc("pay-1").set({
    patientId: "pat-ana",
    appointmentId: null,
    packageId: null,
    origem: "paciente",
    recorrente: false,
    seriesId: null,
    descricao: "Sessão avulsa",
    valor: 200,
    valorAcordado: 200,
    dueDate: isoDate(5),
    status: "agendado",
    paidAt: null,
    formaPagamento: "pix",
    historico: [],
    ownerUid: uid,
    createdAt: now,
  });

  await db.collection("payments").doc("pay-future").set({
    patientId: "pat-teste",
    appointmentId: null,
    packageId: null,
    origem: "paciente",
    recorrente: false,
    seriesId: null,
    descricao: "Pacote 2 Sessoes · 2 sessões",
    valor: 260,
    valorAcordado: 260,
    dueDate: isoDate(12),
    status: "agendado",
    paidAt: null,
    formaPagamento: "pix",
    historico: [],
    ownerUid: uid,
    createdAt: now,
  });

  await db.collection("payments").doc("pay-2").set({
    patientId: "pat-bruno",
    appointmentId: null,
    packageId: null,
    origem: "paciente",
    recorrente: false,
    seriesId: null,
    descricao: "Pacote quinzenal",
    valor: 160,
    valorAcordado: 160,
    dueDate: isoDate(-3),
    status: "em_haver",
    paidAt: null,
    formaPagamento: "pix",
    historico: [],
    ownerUid: uid,
    createdAt: now,
  });

  await db.doc(`directory/${DEMO_EMAIL}`).set({
    uid,
    email: DEMO_EMAIL,
    nome: "Dra. Helena Alves",
    foto: "",
    ownerUid: uid,
  });

  let platformUid = "";
  if (process.env.SEED_LANDING_ONLY !== "1") {
  let platformUser;
  try {
    platformUser = await auth.getUserByEmail(PLATFORM_EMAIL);
  } catch {
    platformUser = await auth.createUser({ email: PLATFORM_EMAIL, password: PLATFORM_PASSWORD, displayName: "Proprietário Plataforma" });
  }

  platformUid = platformUser.uid;
  const platformAccount = buildTrialAccount({
    uid: platformUid,
    email: PLATFORM_EMAIL,
    nome: "Proprietário Plataforma",
    clinicName: "Psy Manager",
    now: Date.now(),
    termsAcceptedAt: now,
  });
  await db.doc(`users/${platformUid}`).set({ ...platformAccount, role: "super_admin" }, { merge: true });
  await seedLegalAcceptances(platformUid);

  await db.collection("members").doc(`member-${platformUid}`).set({
    uid: platformUid,
    ownerUid: platformUid,
    email: PLATFORM_EMAIL,
    nome: "Proprietário Plataforma",
    telefone: "",
    foto: "",
    valorBase: 0,
    valorSocial: 0,
    workHours: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "09:00", endTime: "18:00" })),
    ativo: true,
    createdAt: now,
  });

  await db.doc(`directory/${PLATFORM_EMAIL}`).set({
    uid: platformUid,
    email: PLATFORM_EMAIL,
    nome: "Proprietário Plataforma",
    foto: "",
    ownerUid: platformUid,
  });
  }

  const feedbackExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const feedbackCommon = {
    appointmentId: "appt-1",
    patientId: "pat-ana",
    professionalNome: "Dra. Helena Alves",
    patientNome: "Ana Souza",
    sessionDate: isoDate(0),
    startTime: "10:00",
    ownerUid: uid,
    createdAt: now,
    expiresAt: feedbackExpires.toISOString(),
    expiresAtMillis: feedbackExpires.getTime(),
  };

  await db.collection("sessionFeedbacks").doc(e2eFeedbackDocId(1)).set({
    ...feedbackCommon,
    stars: null,
    comment: "",
    answeredAt: null,
    answeredAtMillis: null,
  });

  await db.collection("sessionFeedbacks").doc(e2eFeedbackDocId(2)).set({
    ...feedbackCommon,
    stars: 5,
    comment: "Já respondido no seed.",
    answeredAt: now,
    answeredAtMillis: Date.now(),
  });

  for (const sequence of [3, 4]) {
    await db.collection("sessionFeedbacks").doc(e2eFeedbackDocId(sequence)).set({
      ...feedbackCommon,
      stars: null,
      comment: "",
      answeredAt: null,
      answeredAtMillis: null,
    });
  }

  const o4Expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const signToken = "e2osignfixture000001";
  const formToken = "e2oformfixture000002";
  await db.collection("signatureRequests").doc(signToken).set({
    ownerUid: uid,
    patientId: "pat-ana",
    patientNome: "Ana Souza",
    kind: "tcle",
    body: "TERMO DE CONSENTIMENTO (demonstração e2e)\n\nTexto fictício para assinatura digital.",
    templateVersion: "tcle-v1",
    modality: "presencial",
    expiresAt: o4Expires.toISOString(),
    expiresAtMillis: o4Expires.getTime(),
    signedAt: null,
    signedAtMillis: null,
    createdAt: now,
  });
  await db.collection("formRequests").doc(formToken).set({
    ownerUid: uid,
    patientId: "pat-ana",
    patientNome: "Ana Souza",
    templateId: "anamnese-tcc",
    templateNome: "Anamnese TCC",
    templateVersion: 1,
    finalidade: "Coleta de histórico clínico inicial (dados fictícios).",
    campos: [
      { id: "queixa", label: "Queixa principal", type: "textarea", required: true },
      { id: "metas", label: "Metas", type: "textarea", required: true },
    ],
    expiresAt: o4Expires.toISOString(),
    expiresAtMillis: o4Expires.getTime(),
    answeredAt: null,
    answeredAtMillis: null,
    createdAt: now,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        uid,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        platformUid,
        platformEmail: PLATFORM_EMAIL,
        platformPassword: PLATFORM_PASSWORD,
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
