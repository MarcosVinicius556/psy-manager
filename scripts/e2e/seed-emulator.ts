/**
 * Popula Auth + Firestore emuladores com conta demo para testes mobile (e2e).
 * Uso: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npx tsx scripts/e2e/seed-emulator.ts
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { buildTrialAccount } from "../../src/lib/saas/model";

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
  const now = new Date().toISOString();
  const trial = buildTrialAccount({
    uid,
    email: DEMO_EMAIL,
    nome: "Dra. Helena Alves",
    clinicName: "Consultório Centro",
    now: Date.now(),
    termsAcceptedAt: now,
  });

  await db.doc(`users/${uid}`).set(trial, { merge: true });

  const memberRef = db.collection("members").doc("member-demo");
  await memberRef.set({
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
  });

  const locationRef = db.collection("locations").doc("loc-demo");
  await locationRef.set({
    nome: "Consultório Centro",
    endereco: "Rua das Flores, 120 — Centro",
    observacoes: "Sala 302",
    memberIds: ["member-demo"],
    memberUids: [uid],
    createdByUid: uid,
    ownerUid: uid,
    createdAt: now,
  });

  const patients = [
    { id: "pat-ana", nome: "Ana Souza", telefone: "49999112233", email: "ana@example.test" },
    { id: "pat-bruno", nome: "Bruno Lima", telefone: "49999223344", email: "bruno@example.test" },
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

  await db.collection("appointments").doc("appt-1").set({
    patientId: "pat-ana",
    date: isoDate(0),
    startTime: "10:00",
    endTime: "11:00",
    modality: "presencial",
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
    status: "agendado",
    clinical: {},
    accessUids: [uid],
    ownerUid: uid,
    createdAt: now,
    updatedAt: now,
  });

  await db.collection("appointments").doc("appt-2").set({
    patientId: "pat-bruno",
    date: isoDate(1),
    startTime: "14:00",
    endTime: "15:00",
    modality: "online",
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
    status: "agendado",
    clinical: {},
    accessUids: [uid],
    ownerUid: uid,
    createdAt: now,
    updatedAt: now,
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

  let platformUser;
  try {
    platformUser = await auth.getUserByEmail(PLATFORM_EMAIL);
  } catch {
    platformUser = await auth.createUser({ email: PLATFORM_EMAIL, password: PLATFORM_PASSWORD, displayName: "Proprietário Plataforma" });
  }

  const platformUid = platformUser.uid;
  const platformAccount = buildTrialAccount({
    uid: platformUid,
    email: PLATFORM_EMAIL,
    nome: "Proprietário Plataforma",
    clinicName: "Psy Manager",
    now: Date.now(),
    termsAcceptedAt: now,
  });
  await db.doc(`users/${platformUid}`).set({ ...platformAccount, role: "super_admin" }, { merge: true });

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
