/**
 * Rules coverage for every client-side Firestore path used by `master` (production) and
 * `develop` (test env), which share the same Firebase project. Paths marked "master" mirror
 * src/lib/admin/collections.ts, src/lib/saas/account-store.ts, src/lib/saas/platform-store.ts
 * and src/lib/admin/dashboard-store.ts on master; "develop" mirrors the same modules here.
 * All fixtures are fictional; ids are built at runtime.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const PROJECT_ID = "psy-rules-compat-test";
const DAY = 24 * 60 * 60 * 1000;

const owner = "uid-owner-a";
const colleague = "uid-colleague-b";
const stranger = "uid-stranger-c";
const admin = "uid-super-d";
const secretary = "uid-secretary-e";
const expired = "uid-expired-f";
const unbilled = "uid-unbilled-g";
const fresh = "uid-fresh-h";
const replay = "uid-replay-i";
const paid = "uid-paid-j";
const locationId = "loc-1";

const mail = (name: string) => `${name}@example.com`;

let env: RulesTestEnvironment;

type Ctx = ReturnType<RulesTestEnvironment["authenticatedContext"]>;
function as(uid: string, email = mail(uid.replace("uid-", ""))) {
  return env.authenticatedContext(uid, { email }).firestore();
}
function anon() {
  return env.unauthenticatedContext().firestore();
}
function staffDb() {
  return env.authenticatedContext(secretary, {
    email: mail("secretary"),
    staffOf: owner,
    staffPerms: ["agenda", "pacientes", "financeiro"],
  }).firestore();
}
async function seed(fn: (db: ReturnType<Ctx["firestore"]>) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await fn(context.firestore());
  });
}

function emptyClinical() {
  return {
    mood: "",
    clinicalEvolution: "",
    notes: "",
    aspectosCognitivos: "",
    aspectosEmocionais: "",
    intervencoes: "",
    objetivos: "",
    evolucaoSessao: "",
    anamneseArquivos: [],
    atividadesArquivos: [],
  };
}

function trialAccount(uid: string, email: string, now = Date.now()) {
  return {
    uid,
    email,
    nome: "Pessoa Teste",
    clinicName: "",
    role: "psicologo",
    accountStatus: "ativa",
    subscriptionStatus: "trial_ativo",
    billingAccess: "trial",
    planId: "avaliacao",
    trialStartedAt: new Date(now).toISOString(),
    trialEndsAt: new Date(now + 30 * DAY).toISOString(),
    trialStartedAtMillis: now,
    trialEndsAtMillis: now + 30 * DAY,
    termsAcceptedAt: new Date(now).toISOString(),
    termsVersion: "v-test",
    privacyAcknowledgedAt: new Date(now).toISOString(),
    checkoutStatus: "",
    checkoutPlanId: "",
    checkoutRequestedAt: "",
    onboardingDismissed: false,
    operationalEmail: true,
    productEmail: true,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    lastSeenAt: "",
  };
}

function memberRow(uid: string, ownerUid = uid) {
  return {
    uid,
    ownerUid,
    email: mail(uid.replace("uid-", "")),
    nome: "Pessoa Teste",
    telefone: "",
    foto: "",
    valorBase: 0,
    valorSocial: 0,
    workHours: [],
    ativo: true,
    createdAt: new Date().toISOString(),
  };
}

const legado = { role: "psicologo", billingAccess: "legado", subscriptionStatus: "legado", accountStatus: "ativa", planId: "legado" };

async function seedBase() {
  const now = Date.now();
  await seed(async (db) => {
    await setDoc(doc(db, "users", owner), { uid: owner, email: mail("owner-a"), ...legado });
    await setDoc(doc(db, "users", colleague), { uid: colleague, email: mail("colleague-b"), ...legado });
    await setDoc(doc(db, "users", stranger), { uid: stranger, email: mail("stranger-c"), ...legado });
    await setDoc(doc(db, "users", admin), { uid: admin, email: mail("super-d"), role: "super_admin", billingAccess: "legado" });
    await setDoc(doc(db, "users", secretary), {
      uid: secretary,
      role: "secretaria",
      billingAccess: "restrito",
      subscriptionStatus: "cortesia",
      accountStatus: "ativa",
      planId: "equipe",
    });
    await setDoc(doc(db, "users", expired), {
      ...trialAccount(expired, mail("expired-f"), now - 40 * DAY),
    });
    await setDoc(doc(db, "users", unbilled), { uid: unbilled, email: mail("unbilled-g"), nome: "Sem cobrança" });
    await setDoc(doc(db, "users", paid), {
      uid: paid,
      email: mail("paid-j"),
      role: "psicologo",
      billingAccess: "integral",
      subscriptionStatus: "ativa",
      accountStatus: "ativa",
      planId: "mensal",
      paidUntilMillis: now + 10 * DAY,
    });

    await setDoc(doc(db, "members", "member-owner"), memberRow(owner));
    await setDoc(doc(db, "members", "member-expired"), memberRow(expired));
    await setDoc(doc(db, "patients", "patient-1"), { ownerUid: owner, nome: "Paciente Demo", status: "ativo" });
    await setDoc(doc(db, "payments", "payment-1"), { ownerUid: owner, patientId: "patient-1", valor: 100, status: "agendado", dueDate: "2099-01-01" });
    await setDoc(doc(db, "packages", "package-1"), { ownerUid: owner, nome: "Pacote", versao: 1 });
    await setDoc(doc(db, "notifications", "notification-1"), { ownerUid: owner, paymentId: "payment-1", lida: false });
    await setDoc(doc(db, "locations", locationId), {
      ownerUid: owner,
      createdByUid: owner,
      nome: "Sala",
      endereco: "",
      observacoes: "",
      memberIds: ["member-owner"],
      memberUids: [owner],
    });
    // master-shaped appointment: no sessionStartMillis, clinical stored on the doc.
    await setDoc(doc(db, "appointments", "appt-master-past"), {
      ownerUid: owner,
      patientId: "patient-1",
      date: "2020-01-10",
      startTime: "10:00",
      endTime: "10:50",
      locationId,
      status: "concluido",
      clinical: { ...emptyClinical(), clinicalEvolution: "texto fictício" },
      accessUids: [owner],
    });
    // develop-shaped past appointment.
    await setDoc(doc(db, "appointments", "appt-dev-past"), {
      ownerUid: owner,
      patientId: "patient-1",
      date: "2020-01-11",
      startTime: "10:00",
      sessionStartMillis: now - 300 * DAY,
      locationId,
      accessUids: [owner],
    });
    await setDoc(doc(db, "expenses", "expense-1"), {
      ownerUid: owner,
      locationId,
      descricao: "Aluguel",
      valor: 100,
      paga: false,
      parcelasRestantes: 0,
      vencimento: "2099-01-05",
      shares: [{ memberId: "member-owner", valor: 100, paga: false }],
      accessUids: [owner],
    });
    await setDoc(doc(db, "clinicalRecords", "appt-dev-past"), { ownerUid: owner, patientId: "patient-1", clinical: { notes: "x" } });
    await setDoc(doc(db, "keys", owner), { ownerUid: owner, wrapped: "fake" });
    await setDoc(doc(db, "integrations", owner), { ownerUid: owner, provider: "fake" });
    await setDoc(doc(db, "emailIntegrations", owner), { ownerUid: owner, provider: "fake" });
    await setDoc(doc(db, "patientPrivate", `${owner}_patient-1`), { ownerUid: owner, patientId: "patient-1", observacoes: "x" });
    await setDoc(doc(db, "clinicalNoteTemplates", "cnt-1"), { ownerUid: owner, nome: "Modelo" });
    await setDoc(doc(db, "consentRecords", "consent-1"), { ownerUid: owner, patientId: "patient-1" });
    await setDoc(doc(db, "formResponses", "form-resp-1"), { ownerUid: owner, patientId: "patient-1" });
    await setDoc(doc(db, "clinicalAccessLog", "log-1"), { ownerUid: owner, patientId: "patient-1" });
    await setDoc(doc(db, "plans", "mensal"), { nome: "Mensal", ordem: 1 });
    await setDoc(doc(db, "directory", mail("colleague-b")), { uid: colleague, email: mail("colleague-b"), nome: "Colega", foto: "", ownerUid: colleague });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (env) await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seedBase();
});

const ownerScopedLists = [
  "patients",
  "payments",
  "packages",
  "notifications",
  "members",
  "sessionFeedbacks",
  "reportTemplates",
  "reportRuns",
  "contractTemplates",
  "emailTemplates",
  "clinicalNoteTemplates",
  "emailLog",
  "appointments",
  "expenses",
  "locations",
  "locationInvites",
  "bookingRequests",
  "consentRecords",
  "signatureRequests",
  "formTemplates",
  "formRequests",
  "formResponses",
  "clinicalAccessLog",
  "supervisionExportLog",
  "staffMembers",
] as const;

describe("owner listings (master listCollection/listShared, develop listCollection/export)", () => {
  for (const name of ownerScopedLists) {
    it(`owner lists own ${name}`, async () => {
      await assertSucceeds(getDocs(query(collection(as(owner), name), where("ownerUid", "==", owner))));
    });
    it(`stranger cannot list another tenant's ${name}`, async () => {
      await assertFails(getDocs(query(collection(as(stranger), name), where("ownerUid", "==", owner))));
    });
  }

  it("shared listings by array-contains (appointments, expenses, locations)", async () => {
    const db = as(owner);
    await assertSucceeds(getDocs(query(collection(db, "appointments"), where("accessUids", "array-contains", owner))));
    await assertSucceeds(getDocs(query(collection(db, "expenses"), where("accessUids", "array-contains", owner))));
    await assertSucceeds(getDocs(query(collection(db, "locations"), where("memberUids", "array-contains", owner))));
    await assertSucceeds(getDocs(query(collection(db, "locationInvites"), where("inviteeUid", "==", owner))));
  });

  it("develop window queries and data export", async () => {
    const db = as(owner);
    const start = Date.now() - DAY;
    const end = Date.now() + DAY;
    await assertSucceeds(
      getDocs(query(collection(db, "appointments"), where("ownerUid", "==", owner), where("sessionStartMillis", ">=", start), where("sessionStartMillis", "<=", end)))
    );
    await assertSucceeds(
      getDocs(query(collection(db, "payments"), where("ownerUid", "==", owner), where("dueDateMillis", ">=", start), where("dueDateMillis", "<=", end)))
    );
    for (const name of ["patients", "appointments", "payments"]) {
      await assertSucceeds(getDocs(query(collection(db, name), where("ownerUid", "==", owner), limit(500))));
      await assertSucceeds(getDocs(query(collection(db, name), where("ownerUid", "==", owner), where("demo", "==", true))));
    }
    await assertSucceeds(getDocs(query(collection(db, "legalAcceptances"), where("uid", "==", owner))));
    await assertSucceeds(getDocs(query(collection(db, "emailLog"), where("ownerUid", "==", owner), where("templateId", "==", "t1"))));
  });

  it("claimUnownedRecords' unfiltered scan stays denied (cross-tenant)", async () => {
    for (const name of ["patients", "appointments", "payments", "members", "locations", "expenses"]) {
      await assertFails(getDocs(collection(as(owner), name)));
    }
  });

  it("no signed-in user can list a whole collection", async () => {
    for (const name of [...ownerScopedLists, "users", "directory", "trialClaims", "memberPrivate", "patientPrivate", "fechamentos", "activationEvents", "clinicalRecords", "keys", "platformAudit", "platformMessages"]) {
      await assertFails(getDocs(collection(as(stranger), name)));
    }
  });
});

describe("master clinic writes", () => {
  it("packages, notifications, reports, contracts CRUD", async () => {
    const db = as(owner);
    const now = new Date().toISOString();
    const pkg = await assertSucceeds(addDoc(collection(db, "packages"), { nome: "P", tipo: "mensal", valorSessao: 1, sessoes: 4, versao: 1, historico: [], arquivado: false, arquivadoEm: null, ownerUid: owner, createdAt: now, updatedAt: now }));
    await assertSucceeds(updateDoc(pkg, { versao: 2, updatedAt: now }));
    await assertSucceeds(updateDoc(pkg, { arquivado: true, arquivadoEm: now }));
    const note = await assertSucceeds(addDoc(collection(db, "notifications"), { type: "payment_due", paymentId: "payment-1", patientId: "patient-1", date: "2099-01-01", lida: false, resposta: null, createdAt: now, ownerUid: owner }));
    await assertSucceeds(updateDoc(note, { lida: true }));
    await assertSucceeds(deleteDoc(note));
    const tpl = await assertSucceeds(addDoc(collection(db, "reportTemplates"), { nome: "R", definition: {}, ownerUid: owner, updatedAt: now, createdAt: now }));
    await assertSucceeds(updateDoc(tpl, { nome: "R2", definition: {}, ownerUid: owner, updatedAt: now }));
    await assertSucceeds(deleteDoc(tpl));
    const run = await assertSucceeds(addDoc(collection(db, "reportRuns"), { nome: "R", definition: {}, rowCount: 1, pdf: null, ownerUid: owner, createdAt: now }));
    await assertSucceeds(deleteDoc(run));
    const contract = await assertSucceeds(addDoc(collection(db, "contractTemplates"), { nome: "C", conteudo: "texto", versao: 1, historico: [], ownerUid: owner, createdAt: now, updatedAt: now }));
    await assertSucceeds(getDoc(contract));
    await assertSucceeds(updateDoc(contract, { nome: "C2", conteudo: "t2", versao: 2, historico: [], updatedAt: now }));
    await assertSucceeds(deleteDoc(contract));
  });

  it("locations, members, expenses", async () => {
    const db = as(owner);
    const loc = await assertSucceeds(addDoc(collection(db, "locations"), { nome: "L", endereco: "", observacoes: "", memberIds: [], memberUids: [owner], createdByUid: owner, ownerUid: owner, createdAt: "x" }));
    await assertSucceeds(updateDoc(loc, { nome: "L2", endereco: "", observacoes: "" }));
    await assertSucceeds(deleteDoc(loc));
    const member = await assertSucceeds(addDoc(collection(db, "members"), { ...memberRow("uid-none", owner), uid: null }));
    await assertSucceeds(updateDoc(member, { nome: "Outro", valorBase: 120, workHours: [] }));
    const exp = await assertSucceeds(addDoc(collection(db, "expenses"), { descricao: "E", tipo: "fixo", valor: 1, shares: [], ownerUid: owner, accessUids: [owner], createdAt: "x" }));
    await assertSucceeds(updateDoc(exp, { descricao: "E2", accessUids: [owner, colleague] }));
    await assertSucceeds(updateDoc(exp, { paga: true, parcelasRestantes: 0 }));
    await assertSucceeds(deleteDoc(exp));
  });

  it("patients keep legacy observacoes/contatoEmergencia (compat)", async () => {
    const db = as(owner);
    const input = { nome: "Paciente", cpf: "", nascimento: "", telefone: "", email: "", endereco: "", contatoEmergencia: "c", observacoes: "o", foto: "", status: "ativo" };
    const ref = await assertSucceeds(addDoc(collection(db, "patients"), { ...input, ownerUid: owner, createdAt: "x" }));
    await assertSucceeds(updateDoc(ref, { ...input, observacoes: "o2" }));
    await assertSucceeds(updateDoc(ref, { contratoAssinado: null }));
  });

  it("appointments with the full clinical shape (compat), series and payments", async () => {
    const db = as(owner);
    const input = { patientId: "patient-1", date: "2099-02-01", startTime: "10:00", endTime: "10:50", modality: "presencial", professionalId: null, locationId, sessionType: "padrao", valor: 100, status: "agendado", clinical: emptyClinical() };
    const ref = await assertSucceeds(addDoc(collection(db, "appointments"), { ...input, ownerUid: owner, accessUids: [owner], createdAt: "x", updatedAt: "x" }));
    await assertSucceeds(updateDoc(ref, { clinical: { ...emptyClinical(), mood: "bem", clinicalEvolution: "fictício" }, updatedAt: "y" }));
    await assertSucceeds(updateDoc(ref, { status: "concluido", clinical: { ...emptyClinical(), notes: "n" }, updatedAt: "z" }));
    await assertSucceeds(updateDoc(ref, { accessUids: arrayUnion(colleague) }));
    const batch = writeBatch(db);
    batch.set(doc(collection(db, "appointments")), { ...input, ownerUid: owner, accessUids: [owner], createdAt: "x", updatedAt: "x" });
    batch.set(doc(collection(db, "payments")), { patientId: "patient-1", valor: 1, historico: [], status: "agendado", paidAt: null, ownerUid: owner, createdAt: "x" });
    await assertSucceeds(batch.commit());
    await assertSucceeds(updateDoc(doc(db, "payments", "payment-1"), { status: "pago", paidAt: "x", historico: [] }));
  });

  it("session feedback is created by the owner", async () => {
    await assertSucceeds(
      setDoc(doc(as(owner), "sessionFeedbacks", "token-new"), {
        appointmentId: "a",
        patientId: "patient-1",
        professionalNome: "P",
        patientNome: "Q",
        sessionDate: "2099-01-01",
        startTime: "10:00",
        stars: null,
        comment: "",
        answeredAt: null,
        answeredAtMillis: null,
        expiresAt: "x",
        expiresAtMillis: Date.now() + DAY,
        ownerUid: owner,
        createdAt: "x",
      })
    );
  });
});

describe("login and account (upsertPsychologist, account-store)", () => {
  it("master upsert for an existing legado user", async () => {
    const db = as(owner, mail("owner-a"));
    const byUid = await assertSucceeds(getDocs(query(collection(db, "members"), where("uid", "==", owner))));
    await assertSucceeds(updateDoc(byUid.docs[0].ref, { uid: owner, ownerUid: owner, email: mail("owner-a"), nome: "Pessoa", foto: "", ativo: true }));
    await assertSucceeds(getDoc(doc(db, "users", owner)));
    await assertSucceeds(setDoc(doc(db, "users", owner), { uid: owner, email: mail("owner-a"), role: "psicologo" }, { merge: true }));
    await assertSucceeds(setDoc(doc(db, "directory", mail("owner-a")), { uid: owner, email: mail("owner-a"), nome: "Pessoa", foto: "", ownerUid: owner }, { merge: true }));
  });

  it("expired trial user can still log in (member sync + expirePatch)", async () => {
    const db = as(expired, mail("expired-f"));
    await assertSucceeds(updateDoc(doc(db, "members", "member-expired"), { uid: expired, ownerUid: expired, email: mail("expired-f"), nome: "Pessoa", foto: "", ativo: true }));
    await assertSucceeds(updateDoc(doc(db, "users", expired), { subscriptionStatus: "trial_expirado", billingAccess: "restrito", updatedAt: "x" }));
    // ...but clinic data stays read-only.
    await assertFails(updateDoc(doc(db, "members", "member-expired"), { valorBase: 300 }));
    await assertFails(addDoc(collection(db, "patients"), { nome: "X", ownerUid: expired }));
  });

  it("user without billing adopts legado", async () => {
    const db = as(unbilled, mail("unbilled-g"));
    await assertSucceeds(setDoc(doc(db, "users", unbilled), { uid: unbilled, email: mail("unbilled-g"), role: "psicologo" }, { merge: true }));
    await assertSucceeds(updateDoc(doc(db, "users", unbilled), { accountStatus: "ativa", subscriptionStatus: "legado", billingAccess: "legado", planId: "legado", updatedAt: "x" }));
  });

  it("master first login: member row before users doc, trial claim, trial account", async () => {
    const email = mail("fresh-h");
    const db = as(fresh, email);
    await assertSucceeds(getDocs(query(collection(db, "members"), where("uid", "==", fresh))));
    await assertSucceeds(getDocs(query(collection(db, "members"), where("ownerUid", "==", fresh))));
    await assertSucceeds(addDoc(collection(db, "members"), memberRow(fresh)));
    await assertSucceeds(getDoc(doc(db, "users", fresh)));
    await assertSucceeds(getDoc(doc(db, "trialClaims", email)));
    await assertSucceeds(setDoc(doc(db, "trialClaims", email), { email, uid: fresh, ownerUid: fresh, createdAt: "x" }));
    await assertSucceeds(setDoc(doc(db, "users", fresh), trialAccount(fresh, email)));
    await assertSucceeds(setDoc(doc(db, "directory", email), { uid: fresh, email, nome: "N", foto: "", ownerUid: fresh }, { merge: true }));
  });

  it("develop first login: transaction claim, canonical member doc, activation event", async () => {
    const email = mail("fresh-h");
    const db = as(fresh, email);
    await assertSucceeds(
      runTransaction(db, async (tx) => {
        const ref = doc(db, "trialClaims", email);
        const snap = await tx.get(ref);
        if (!snap.exists()) tx.set(ref, { email, uid: fresh, ownerUid: fresh, createdAt: "x" });
      })
    );
    await assertSucceeds(setDoc(doc(db, "users", fresh), { ...trialAccount(fresh, email), cancelAtPeriodEnd: false, accessUntilMillis: 0 }));
    await assertSucceeds(getDoc(doc(db, "activationEvents", `${fresh}_signup`)));
    await assertSucceeds(setDoc(doc(db, "activationEvents", `${fresh}_signup`), { accountId: fresh, event: "signup", at: "x" }));
    await assertSucceeds(setDoc(doc(db, "activationEvents", `${fresh}_primeiro_recibo`), { accountId: fresh, event: "primeiro_recibo", at: "x" }));
    await assertSucceeds(getDoc(doc(db, "members", fresh)));
    await assertSucceeds(setDoc(doc(db, "members", fresh), memberRow(fresh)));
    await assertSucceeds(getDoc(doc(db, "members", fresh)));
    await assertSucceeds(getDoc(doc(db, "memberPrivate", fresh)));
  });

  it("replayed trial email gets a restricted account and can still log in", async () => {
    const email = mail("replay-i");
    await seed(async (db) => {
      await setDoc(doc(db, "trialClaims", email), { email, uid: "uid-someone-else", ownerUid: "uid-someone-else", createdAt: "x" });
    });
    const db = as(replay, email);
    await assertSucceeds(getDoc(doc(db, "trialClaims", email)));
    const now = Date.now();
    await assertSucceeds(
      setDoc(doc(db, "users", replay), {
        ...trialAccount(replay, email, now),
        subscriptionStatus: "trial_expirado",
        billingAccess: "restrito",
        trialEndsAtMillis: now - 1000,
        trialStartedAtMillis: now - 1000,
      })
    );
    await assertSucceeds(setDoc(doc(db, "members", replay), memberRow(replay)));
  });

  it("saas account: profile, last seen, layout, inbox, master checkout and trial cancel", async () => {
    const now = Date.now();
    await seed(async (sdb) => {
      await setDoc(doc(sdb, "users", fresh), trialAccount(fresh, mail("fresh-h"), now));
    });
    const db = as(fresh, mail("fresh-h"));
    await assertSucceeds(updateDoc(doc(db, "users", fresh), { lastSeenAt: "x" }));
    await assertSucceeds(updateDoc(doc(db, "users", fresh), { nome: "N", clinicName: "C", onboardingDismissed: true, updatedAt: "x" }));
    await assertSucceeds(updateDoc(doc(db, "users", fresh), { dashboardLayout: { version: 1, widgets: [] } }));
    await assertSucceeds(getDocs(collection(db, "plans")));
    await assertSucceeds(getDocs(collection(db, "users", fresh, "inbox")));
    await assertSucceeds(getDoc(doc(db, "users", fresh, "inbox", "boas_vindas")));
    await assertSucceeds(setDoc(doc(db, "users", fresh, "inbox", "boas_vindas"), { kind: "boas_vindas", categoria: "operacional", titulo: "Oi", corpo: "Texto", lida: false, emailResult: "pendente", createdAt: "x" }));
    await assertSucceeds(updateDoc(doc(db, "users", fresh, "inbox", "boas_vindas"), { lida: true, lidaEm: "x" }));
    await assertSucceeds(updateDoc(doc(db, "users", fresh, "inbox", "boas_vindas"), { emailResult: "enviado" }));
    // master checkoutPatch()
    await assertSucceeds(updateDoc(doc(db, "users", fresh), { checkoutStatus: "aguardando_provedor", checkoutPlanId: "mensal", checkoutRequestedAt: "x", updatedAt: "x" }));
    await assertSucceeds(addDoc(collection(db, "users", fresh, "billingEvents"), { tipo: "checkout_solicitado", resultado: "registrado", planId: "mensal", at: "x", summary: "s" }));
    // develop checkoutPatch()
    await assertSucceeds(updateDoc(doc(db, "users", fresh), { checkoutStatus: "aguardando_confirmacao_pix", checkoutPlanId: "mensal", pixTxid: "TXTEST", checkoutRequestedAt: "x", updatedAt: "x" }));
    // trial cancel (master and develop shapes)
    await assertSucceeds(updateDoc(doc(db, "users", fresh), { subscriptionStatus: "cancelada", billingAccess: "restrito", cancelAtPeriodEnd: false, accessUntilMillis: 0, canceledAt: "x", cancelReason: "", updatedAt: "x" }));
    await assertSucceeds(addDoc(collection(db, "users", fresh, "billingEvents"), { tipo: "cancelamento_solicitado", resultado: "registrado", planId: "avaliacao", at: "x", summary: "s" }));
  });

  it("develop paid cancel at period end", async () => {
    const now = Date.now();
    await seed(async (sdb) => {
      await updateDoc(doc(sdb, "users", paid), { paidUntilMillis: now + 10 * DAY });
    });
    await assertSucceeds(updateDoc(doc(as(paid), "users", paid), { cancelAtPeriodEnd: true, accessUntilMillis: now + 10 * DAY, updatedAt: "x" }));
  });

  it("develop memberPrivate, fechamentos and canonical reads", async () => {
    const db = as(owner);
    const closing = `${owner}_209901`;
    await assertSucceeds(getDoc(doc(db, "memberPrivate", owner)));
    await assertSucceeds(setDoc(doc(db, "memberPrivate", owner), { ownerUid: owner, pixChave: "chave", pixTipo: "email", updatedAt: "x" }, { merge: true }));
    await assertSucceeds(getDoc(doc(db, "memberPrivate", owner)));
    await assertSucceeds(getDoc(doc(db, "fechamentos", closing)));
    await assertSucceeds(setDoc(doc(db, "fechamentos", closing), { ownerUid: owner, month: "2099-01", closedAt: "x", summary: {} }, { merge: true }));
    await assertSucceeds(getDoc(doc(db, "fechamentos", closing)));
  });

  it("develop appointment edit on a legacy doc that already carries clinical", async () => {
    await assertSucceeds(updateDoc(doc(as(owner), "appointments", "appt-master-past"), { status: "faltou", updatedAt: "x", googleMeetLink: null }));
  });
});

describe("location invites (master and develop)", () => {
  it("owner invites, invitee accepts and joins listed appointments and expenses", async () => {
    const ownerDb = as(owner);
    const inviteId = `${locationId}_${colleague}`;
    await assertSucceeds(getDoc(doc(ownerDb, "directory", mail("colleague-b"))));
    await assertSucceeds(
      setDoc(doc(ownerDb, "locationInvites", inviteId), {
        locationId,
        locationNome: "Sala",
        ownerUid: owner,
        inviterNome: "P",
        inviteeUid: colleague,
        inviteeEmail: mail("colleague-b"),
        inviteeNome: "Colega",
        appointmentIds: ["appt-master-past", "appt-dev-past"],
        expenseIds: ["expense-1"],
        status: "pendente",
        createdAt: "x",
      })
    );
    const db = as(colleague);
    await assertSucceeds(getDocs(query(collection(db, "locationInvites"), where("inviteeUid", "==", colleague))));
    await assertSucceeds(updateDoc(doc(db, "locationInvites", inviteId), { status: "aceito" }));
    await assertSucceeds(updateDoc(doc(db, "locations", locationId), { memberUids: arrayUnion(colleague) }));
    await assertSucceeds(updateDoc(doc(db, "appointments", "appt-master-past"), { accessUids: arrayUnion(colleague) }));
    await assertSucceeds(updateDoc(doc(db, "expenses", "expense-1"), { accessUids: arrayUnion(colleague) }));
    // develop docs keep the future-only rule even when listed.
    await assertFails(updateDoc(doc(db, "appointments", "appt-dev-past"), { accessUids: arrayUnion(colleague) }));
    // co-member pays its share.
    await assertSucceeds(updateDoc(doc(db, "expenses", "expense-1"), { shares: [{ memberId: "member-owner", valor: 100, paga: true }] }));
  });

  it("invites cannot be forged", async () => {
    const base = { locationId, ownerUid: owner, inviteeUid: colleague, status: "pendente", appointmentIds: [], expenseIds: [] };
    await assertFails(setDoc(doc(as(stranger), "locationInvites", `${locationId}_${colleague}`), { ...base, ownerUid: stranger }));
    await assertFails(setDoc(doc(as(owner), "locationInvites", `${locationId}_${stranger}`), base));
    await assertFails(setDoc(doc(as(owner), "locationInvites", `${locationId}_${colleague}`), { ...base, status: "aceito" }));
    await assertFails(setDoc(doc(as(colleague), "locationInvites", `${locationId}_${colleague}`), { ...base, ownerUid: colleague }));
  });

  it("invitee cannot join master appointments not listed in an accepted invite", async () => {
    await seed(async (sdb) => {
      await setDoc(doc(sdb, "locationInvites", `${locationId}_${colleague}`), { locationId, ownerUid: owner, inviteeUid: colleague, status: "aceito", appointmentIds: [], expenseIds: [] });
    });
    await assertFails(updateDoc(doc(as(colleague), "appointments", "appt-master-past"), { accessUids: arrayUnion(colleague) }));
    await assertFails(updateDoc(doc(as(stranger), "appointments", "appt-master-past"), { accessUids: arrayUnion(stranger) }));
  });
});

describe("public session feedback (master compat)", () => {
  async function seedFeedback(id: string, extra: Record<string, unknown> = {}) {
    await seed(async (sdb) => {
      await setDoc(doc(sdb, "sessionFeedbacks", id), {
        ownerUid: owner,
        appointmentId: "a",
        patientId: "patient-1",
        professionalNome: "P",
        patientNome: "Q",
        stars: null,
        comment: "",
        answeredAt: null,
        answeredAtMillis: null,
        expiresAtMillis: Date.now() + DAY,
        ...extra,
      });
    });
  }
  const answer = () => ({ stars: 5, comment: "ok", answeredAt: new Date().toISOString(), answeredAtMillis: Date.now() });

  it("anyone with the token reads it and answers once", async () => {
    await seedFeedback("fb-open");
    await assertSucceeds(getDoc(doc(anon(), "sessionFeedbacks", "fb-open")));
    await assertSucceeds(updateDoc(doc(anon(), "sessionFeedbacks", "fb-open"), answer()));
    await assertFails(updateDoc(doc(anon(), "sessionFeedbacks", "fb-open"), answer()));
  });

  it("no listing, no expired answers, no extra fields", async () => {
    await seedFeedback("fb-expired", { expiresAtMillis: Date.now() - 1000 });
    await seedFeedback("fb-extra");
    await assertFails(getDocs(collection(anon(), "sessionFeedbacks")));
    await assertFails(updateDoc(doc(anon(), "sessionFeedbacks", "fb-expired"), answer()));
    await assertFails(updateDoc(doc(anon(), "sessionFeedbacks", "fb-extra"), { ...answer(), ownerUid: stranger }));
    await assertFails(updateDoc(doc(anon(), "sessionFeedbacks", "fb-extra"), { ...answer(), stars: 9 }));
    await assertFails(deleteDoc(doc(anon(), "sessionFeedbacks", "fb-extra")));
  });
});

describe("super admin (platform-store)", () => {
  it("platform panel paths", async () => {
    const db = as(admin);
    await assertSucceeds(getDocs(collection(db, "users")));
    await assertSucceeds(getDocs(collection(db, "platformAudit")));
    await assertSucceeds(getDocs(collection(db, "activationEvents")));
    await assertSucceeds(getDocs(collection(db, "users", owner, "billingEvents")));
    await assertSucceeds(getDocs(collection(db, "users", owner, "inbox")));
    await assertSucceeds(updateDoc(doc(db, "users", expired), { subscriptionStatus: "trial_ativo", billingAccess: "trial", trialEndsAtMillis: Date.now() + 7 * DAY, updatedAt: "x" }));
    await assertSucceeds(addDoc(collection(db, "users", expired, "billingEvents"), { tipo: "extensao_trial", resultado: "registrado", planId: "avaliacao", at: "x", summary: "s" }));
    await assertSucceeds(addDoc(collection(db, "platformAudit"), { actorUid: admin, action: "estender_trial", targetUid: expired, at: "x", result: "ok" }));
    await assertSucceeds(setDoc(doc(db, "plans", "anual"), { nome: "Anual", ordem: 2 }));
    await assertSucceeds(updateDoc(doc(db, "plans", "mensal"), { nome: "Mensal 2", updatedAt: "x" }));
    const msg = await assertSucceeds(addDoc(collection(db, "platformMessages"), { titulo: "T", corpo: "C", status: "registrando", createdAt: "x" }));
    await assertSucceeds(setDoc(doc(db, "users", owner, "inbox", msg.id), { kind: "admin", categoria: "produto", titulo: "T", corpo: "C", lida: false, emailResult: "pendente", createdAt: "x" }));
    await assertSucceeds(updateDoc(doc(db, "users", owner, "inbox", msg.id), { emailResult: "enviado" }));
    await assertSucceeds(updateDoc(msg, { status: "concluido", enviados: 1, falhas: 0, concluidoEm: "x" }));
    await assertSucceeds(getDocs(collection(db, "platformMessages")));
    // provisionPsychologist
    const newUid = "uid-provisioned-k";
    await assertSucceeds(setDoc(doc(db, "users", newUid), { uid: newUid, email: mail("prov"), nome: "N", role: "psicologo", ...legado, updatedAt: "x" }));
    await assertSucceeds(addDoc(collection(db, "members"), memberRow(newUid)));
    await assertSucceeds(setDoc(doc(db, "directory", mail("prov")), { uid: newUid, email: mail("prov"), nome: "N", foto: "", ownerUid: newUid }, { merge: true }));
  });

  it("admin cannot fabricate a paid subscription or change roles", async () => {
    const db = as(admin);
    await assertFails(updateDoc(doc(db, "users", owner), { subscriptionStatus: "ativa" }));
    await assertFails(updateDoc(doc(db, "users", owner), { role: "super_admin" }));
  });
});

describe("unauthenticated access is denied", () => {
  const paths: Array<[string, string]> = [
    ["users", owner],
    ["keys", owner],
    ["integrations", owner],
    ["emailIntegrations", owner],
    ["patients", "patient-1"],
    ["appointments", "appt-master-past"],
    ["payments", "payment-1"],
    ["members", "member-owner"],
    ["expenses", "expense-1"],
    ["locations", locationId],
    ["clinicalRecords", "appt-dev-past"],
    ["patientPrivate", `${owner}_patient-1`],
    ["directory", mail("colleague-b")],
    ["trialClaims", mail("owner-a")],
    ["platformAudit", "any"],
    ["memberPrivate", owner],
    ["fechamentos", `${owner}_209901`],
    ["activationEvents", `${owner}_signup`],
  ];
  for (const [name, id] of paths) {
    it(`get ${name}/${id}`, async () => {
      await assertFails(getDoc(doc(anon(), name, id)));
    });
  }
  for (const name of ["users", "patients", "appointments", "payments", "members", "keys", "sessionFeedbacks", "directory"]) {
    it(`list ${name}`, async () => {
      await assertFails(getDocs(collection(anon(), name)));
    });
  }
  it("writes", async () => {
    const db = anon();
    await assertFails(setDoc(doc(db, "patients", "p-anon"), { ownerUid: owner, nome: "x" }));
    await assertFails(updateDoc(doc(db, "users", owner), { role: "super_admin" }));
    await assertFails(setDoc(doc(db, "plans", "free"), { nome: "Grátis" }));
    await assertFails(setDoc(doc(db, "keys", owner), { wrapped: "x" }));
    await assertFails(deleteDoc(doc(db, "appointments", "appt-master-past")));
  });
  it("plans stay publicly readable (landing/pricing)", async () => {
    await assertSucceeds(getDocs(collection(anon(), "plans")));
  });
});

describe("cross-tenant access is denied", () => {
  const owned: Array<[string, string]> = [
    ["users", owner],
    ["patients", "patient-1"],
    ["payments", "payment-1"],
    ["packages", "package-1"],
    ["notifications", "notification-1"],
    ["members", "member-owner"],
    ["appointments", "appt-master-past"],
    ["expenses", "expense-1"],
    ["locations", locationId],
    ["patientPrivate", `${owner}_patient-1`],
    ["memberPrivate", owner],
    ["clinicalNoteTemplates", "cnt-1"],
    ["consentRecords", "consent-1"],
    ["formResponses", "form-resp-1"],
    ["clinicalAccessLog", "log-1"],
  ];
  for (const [name, id] of owned) {
    it(`stranger cannot read ${name}/${id}`, async () => {
      await assertFails(getDoc(doc(as(stranger), name, id)));
    });
  }
  it("stranger cannot write into another tenant", async () => {
    const db = as(stranger);
    await assertFails(updateDoc(doc(db, "patients", "patient-1"), { nome: "x" }));
    await assertFails(updateDoc(doc(db, "appointments", "appt-master-past"), { status: "cancelado" }));
    await assertFails(updateDoc(doc(db, "members", "member-owner"), { nome: "x" }));
    await assertFails(updateDoc(doc(db, "members", "member-owner"), { uid: stranger, ownerUid: stranger, email: mail("stranger-c"), nome: "x", foto: "", ativo: true }));
    await assertFails(updateDoc(doc(db, "payments", "payment-1"), { status: "pago" }));
    await assertFails(deleteDoc(doc(db, "expenses", "expense-1")));
    await assertFails(addDoc(collection(db, "patients"), { ownerUid: owner, nome: "x" }));
    await assertFails(addDoc(collection(db, "members"), memberRow(owner)));
    await assertFails(setDoc(doc(db, "users", owner, "inbox", "boas_vindas"), { kind: "boas_vindas", categoria: "operacional", titulo: "t", corpo: "c" }));
    await assertFails(getDocs(collection(db, "users", owner, "billingEvents")));
    await assertFails(getDocs(collection(db, "users")));
  });
  it("existence probes stay scoped to the caller", async () => {
    const db = as(stranger);
    await assertFails(getDoc(doc(db, "members", owner)));
    await assertFails(getDoc(doc(db, "fechamentos", `${owner}_209901`)));
    await assertFails(getDoc(doc(db, "activationEvents", `${owner}_signup`)));
    await assertFails(getDoc(doc(db, "memberPrivate", owner)));
  });
  it("owner cannot hand a doc to another tenant", async () => {
    await assertFails(updateDoc(doc(as(owner), "expenses", "expense-1"), { ownerUid: stranger }));
    await assertFails(updateDoc(doc(as(owner), "patients", "patient-1"), { ownerUid: stranger }));
    await assertFails(updateDoc(doc(as(owner), "appointments", "appt-master-past"), { ownerUid: stranger }));
  });
});

describe("privilege escalation on own users doc is denied", () => {
  const now = Date.now();
  const escalations: Array<[string, Record<string, unknown>]> = [
    ["role super_admin", { role: "super_admin" }],
    ["role support", { role: "support" }],
    ["billingAccess integral", { billingAccess: "integral" }],
    ["subscriptionStatus ativa", { subscriptionStatus: "ativa" }],
    ["planId", { planId: "anual" }],
    ["accountStatus", { accountStatus: "ativa", billingAccess: "integral" }],
    ["trial end", { trialEndsAtMillis: now + 365 * DAY }],
    ["trial start", { trialStartedAtMillis: now + 365 * DAY }],
    ["paidUntil", { paidUntilMillis: now + 365 * DAY }],
    ["cancel window", { cancelAtPeriodEnd: true, accessUntilMillis: now + 365 * DAY }],
    ["accessUntil", { accessUntilMillis: now + 365 * DAY }],
    ["legacy checkout with billing change", { checkoutStatus: "aguardando_provedor", checkoutPlanId: "mensal", billingAccess: "integral" }],
    ["legacy checkout to trial plan", { checkoutStatus: "aguardando_provedor", checkoutPlanId: "avaliacao" }],
    ["self adopt legado from trial", { billingAccess: "legado", subscriptionStatus: "legado", planId: "legado" }],
  ];
  for (const [label, patch] of escalations) {
    it(label, async () => {
      await seed(async (sdb) => {
        await setDoc(doc(sdb, "users", fresh), trialAccount(fresh, mail("fresh-h"), now));
      });
      await assertFails(updateDoc(doc(as(fresh, mail("fresh-h")), "users", fresh), patch));
    });
  }
  it("paid user cannot extend access while scheduling cancel", async () => {
    await assertFails(updateDoc(doc(as(paid), "users", paid), { cancelAtPeriodEnd: true, accessUntilMillis: Date.now() + 365 * DAY }));
    await assertFails(updateDoc(doc(as(paid), "users", paid), { paidUntilMillis: Date.now() + 365 * DAY }));
  });
  it("account creation cannot grant privileges", async () => {
    const email = mail("fresh-h");
    await seed(async (sdb) => {
      await setDoc(doc(sdb, "trialClaims", email), { email, uid: fresh, ownerUid: fresh, createdAt: "x" });
    });
    const db = as(fresh, email);
    await assertFails(setDoc(doc(db, "users", fresh), { ...trialAccount(fresh, email), role: "super_admin" }));
    await assertFails(setDoc(doc(db, "users", fresh), { ...trialAccount(fresh, email), billingAccess: "integral", subscriptionStatus: "ativa" }));
    await assertFails(setDoc(doc(db, "users", fresh), { ...trialAccount(fresh, email), trialEndsAtMillis: Date.now() + 365 * DAY }));
    await assertFails(setDoc(doc(db, "users", fresh), { ...trialAccount(fresh, email), ...legado }));
    await assertFails(setDoc(doc(db, "trialClaims", mail("other")), { email: mail("other"), uid: fresh }));
  });
  it("restricted user cannot reopen access through the member self-row path", async () => {
    const db = as(expired, mail("expired-f"));
    await assertFails(updateDoc(doc(db, "members", "member-expired"), { uid: expired, ownerUid: expired, nome: "x", politicaFalta: { horas: 1, percentual: 1 } }));
    await assertFails(addDoc(collection(db, "members"), { ...memberRow(expired), cpf: "00000000000" }));
  });
  it("non-admins cannot write platform collections or admin billing events", async () => {
    const db = as(owner);
    await assertFails(addDoc(collection(db, "platformAudit"), { action: "x" }));
    await assertFails(addDoc(collection(db, "platformMessages"), { titulo: "x" }));
    await assertFails(updateDoc(doc(db, "plans", "mensal"), { precoCentavos: 0 }));
    await assertFails(addDoc(collection(db, "users", owner, "billingEvents"), { tipo: "cortesia", resultado: "registrado" }));
    await assertFails(setDoc(doc(db, "users", owner, "inbox", "admin-x"), { kind: "admin", categoria: "produto", titulo: "t", corpo: "c" }));
  });
});

describe("secretary (staff claims) and server-only collections", () => {
  it("secretary cannot read clinical collections", async () => {
    const db = staffDb();
    for (const [name, id] of [
      ["clinicalRecords", "appt-dev-past"],
      ["clinicalNoteTemplates", "cnt-1"],
      ["patientPrivate", `${owner}_patient-1`],
      ["consentRecords", "consent-1"],
      ["formResponses", "form-resp-1"],
      ["clinicalAccessLog", "log-1"],
      ["appointments", "appt-master-past"],
    ] as const) {
      await assertFails(getDoc(doc(db, name, id)));
    }
  });
  it("secretary cannot write clinical data for the tenant", async () => {
    const db = staffDb();
    await assertFails(
      addDoc(collection(db, "appointments"), { ownerUid: owner, patientId: "patient-1", accessUids: [secretary], clinical: emptyClinical() })
    );
    await assertFails(updateDoc(doc(db, "patients", "patient-1"), { observacoes: "x" }));
    await assertFails(addDoc(collection(db, "patients"), { ownerUid: owner, nome: "x", observacoes: "x" }));
    await assertFails(setDoc(doc(db, "clinicalRecords", "new"), { ownerUid: owner }));
  });
  it("owner cannot read or write server-only collections", async () => {
    const db = as(owner);
    for (const name of ["keys", "integrations", "emailIntegrations"]) {
      await assertFails(getDoc(doc(db, name, owner)));
      await assertFails(setDoc(doc(db, name, owner), { ownerUid: owner }));
    }
    for (const name of ["clinicalRecords", "cronRuns", "bookingProfiles", "bookingAvailability", "sessionConfirmations", "supervisionShares", "patientAccounts", "emailAutomationMarkers", "supportTicketCounters"]) {
      await assertFails(getDoc(doc(db, name, "appt-dev-past")));
      await assertFails(setDoc(doc(db, name, "x"), { ownerUid: owner }));
    }
    await assertFails(getDocs(query(collection(db, "clinicalRecords"), where("ownerUid", "==", owner))));
  });
  it("clinical compat is limited to the owner and the full master shape", async () => {
    await assertFails(updateDoc(doc(as(owner), "appointments", "appt-master-past"), { clinical: { clinicalEvolution: "parcial" } }));
    await assertFails(updateDoc(doc(as(owner), "appointments", "appt-master-past"), { clinical: { ...emptyClinical(), extra: "x" } }));
    await seed(async (sdb) => {
      await updateDoc(doc(sdb, "appointments", "appt-master-past"), { accessUids: [owner, colleague] });
    });
    await assertFails(updateDoc(doc(as(colleague), "appointments", "appt-master-past"), { clinical: emptyClinical() }));
  });
});
