import type { Firestore } from "firebase-admin/firestore";
import { normalizeEmail, setPatientCustomClaims } from "./account-utils";

export type PatientConnectionStatus = "ativa" | "desativada" | "desconectada";

export type PatientConnection = {
  id: string;
  patientUid: string;
  ownerUid: string;
  patientId: string;
  status: PatientConnectionStatus;
  isActive: boolean;
  linkedAt: string;
  lastActivatedAt: string;
  deactivatedAt: string | null;
  disconnectedAt: string | null;
  profissionalNome: string;
  profissionalEmail: string;
  patientRecordNome: string;
};

function connectionId(patientUid: string, ownerUid: string, patientId: string) {
  return `${patientUid}_${ownerUid}_${patientId}`;
}

async function memberDisplay(db: Firestore, ownerUid: string) {
  const memberSnap = await db.collection("members").doc(ownerUid).get();
  const data = memberSnap.data() || {};
  const nome = typeof data.nome === "string" ? data.nome : "Profissional";
  const email = typeof data.email === "string" ? data.email : "";
  return { nome, email };
}

function mapConnectionDoc(id: string, data: FirebaseFirestore.DocumentData): PatientConnection {
  return {
    id,
    patientUid: typeof data.patientUid === "string" ? data.patientUid : "",
    ownerUid: typeof data.ownerUid === "string" ? data.ownerUid : "",
    patientId: typeof data.patientId === "string" ? data.patientId : "",
    status: (data.status as PatientConnectionStatus) || "desativada",
    isActive: data.isActive === true,
    linkedAt: typeof data.linkedAt === "string" ? data.linkedAt : "",
    lastActivatedAt: typeof data.lastActivatedAt === "string" ? data.lastActivatedAt : "",
    deactivatedAt: typeof data.deactivatedAt === "string" ? data.deactivatedAt : null,
    disconnectedAt: typeof data.disconnectedAt === "string" ? data.disconnectedAt : null,
    profissionalNome: typeof data.profissionalNome === "string" ? data.profissionalNome : "",
    profissionalEmail: typeof data.profissionalEmail === "string" ? data.profissionalEmail : "",
    patientRecordNome: typeof data.patientRecordNome === "string" ? data.patientRecordNome : "",
  };
}

export async function listPatientConnections(db: Firestore, patientUid: string) {
  const snap = await db.collection("patientConnections").where("patientUid", "==", patientUid).limit(50).get();
  return snap.docs
    .map((doc) => mapConnectionDoc(doc.id, doc.data()))
    .filter((conn) => conn.status === "ativa" || conn.status === "desativada")
    .sort((a, b) => b.lastActivatedAt.localeCompare(a.lastActivatedAt));
}

async function deactivateOtherActiveConnections(
  db: Firestore,
  patientUid: string,
  exceptId: string,
  now: string,
  tx?: FirebaseFirestore.Transaction
) {
  const query = db.collection("patientConnections").where("patientUid", "==", patientUid).limit(50);
  const snap = tx ? await tx.get(query) : await query.get();
  for (const doc of snap.docs) {
    if (doc.id === exceptId) continue;
    if (doc.data().isActive !== true) continue;
    const patch = { isActive: false, updatedAt: now };
    if (tx) tx.set(doc.ref, patch, { merge: true });
    else await doc.ref.set(patch, { merge: true });
  }
}

export async function getActiveConnection(db: Firestore, patientUid: string) {
  const account = await db.collection("patientAccounts").doc(patientUid).get();
  const data = account.data() || {};
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
  const patientId = typeof data.patientId === "string" ? data.patientId : "";
  if (!ownerUid || !patientId) return null;
  const connId = connectionId(patientUid, ownerUid, patientId);
  const connSnap = await db.collection("patientConnections").doc(connId).get();
  if (!connSnap.exists) return null;
  const conn = mapConnectionDoc(connSnap.id, connSnap.data() || {});
  if (conn.status === "desconectada") return null;
  return conn;
}

async function syncAccountActivePointer(db: Firestore, patientUid: string, conn: PatientConnection | null) {
  const now = new Date().toISOString();
  if (!conn) {
    await db.collection("patientAccounts").doc(patientUid).set(
      { ownerUid: null, patientId: null, activeConnectionId: null, updatedAt: now },
      { merge: true }
    );
    return;
  }
  await db.collection("patientAccounts").doc(patientUid).set(
    {
      ownerUid: conn.ownerUid,
      patientId: conn.patientId,
      activeConnectionId: conn.id,
      updatedAt: now,
    },
    { merge: true }
  );
  await setPatientCustomClaims(patientUid, conn.ownerUid, conn.patientId);
}

export async function ensurePatientAccountShell(db: Firestore, uid: string, email: string) {
  const normalized = normalizeEmail(email);
  const ref = db.collection("patientAccounts").doc(uid);
  const snap = await ref.get();
  const now = new Date().toISOString();
  if (!snap.exists) {
    await ref.set({
      email: normalized,
      profileComplete: false,
      nome: "",
      telefone: "",
      telefonePais: "+55",
      ownerUid: null,
      patientId: null,
      activeConnectionId: null,
      createdAt: now,
      updatedAt: now,
    });
    return { profileComplete: false };
  }
  const data = snap.data() || {};
  return { profileComplete: data.profileComplete === true };
}

export async function linkPatientConnection(params: {
  db: Firestore;
  patientUid: string;
  email: string;
  ownerUid: string;
  patientId: string;
  skipEmailCheck?: boolean;
  emailTrustedForLinking?: boolean;
  makeActive?: boolean;
}) {
  const email = normalizeEmail(params.email);
  const now = new Date().toISOString();

  const patientRef = params.db.collection("patients").doc(params.patientId);
  const patientSnap = await patientRef.get();
  if (!patientSnap.exists || patientSnap.data()?.ownerUid !== params.ownerUid) {
    throw new Error("paciente_invalido");
  }
  if (patientSnap.data()?.portalAtivo !== true) {
    throw new Error("portal_desativado");
  }

  const patientEmail =
    typeof patientSnap.data()?.email === "string" ? normalizeEmail(patientSnap.data()!.email) : "";
  if (!params.skipEmailCheck) {
    if (!params.emailTrustedForLinking) {
      throw new Error("email_nao_verificado");
    }
    if (patientEmail && patientEmail !== email) {
      throw new Error("email_nao_confere");
    }
  }

  const patientRecordNome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";
  const prof = await memberDisplay(params.db, params.ownerUid);
  const id = connectionId(params.patientUid, params.ownerUid, params.patientId);
  const existing = await params.db.collection("patientConnections").doc(id).get();

  const makeActive = params.makeActive !== false;
  if (makeActive) {
    await deactivateOtherActiveConnections(params.db, params.patientUid, id, now);
  }

  const payload = {
    patientUid: params.patientUid,
    ownerUid: params.ownerUid,
    patientId: params.patientId,
    status: "ativa" as PatientConnectionStatus,
    isActive: makeActive,
    linkedAt: existing.exists ? (existing.data()?.linkedAt as string) || now : now,
    lastActivatedAt: now,
    deactivatedAt: null,
    disconnectedAt: null,
    profissionalNome: prof.nome,
    profissionalEmail: prof.email,
    patientRecordNome,
    updatedAt: now,
  };

  await params.db.collection("patientConnections").doc(id).set(payload, { merge: true });

  await params.db.collection("patientAccounts").doc(params.patientUid).set(
    {
      email,
      ownerUid: makeActive ? params.ownerUid : existing.data()?.ownerUid || null,
      patientId: makeActive ? params.patientId : existing.data()?.patientId || null,
      activeConnectionId: makeActive ? id : existing.data()?.activeConnectionId || null,
      updatedAt: now,
    },
    { merge: true }
  );

  await patientRef.set({ patientAuthUid: params.patientUid, updatedAt: now }, { merge: true });

  if (makeActive) {
    await setPatientCustomClaims(params.patientUid, params.ownerUid, params.patientId);
  }

  return { connectionId: id };
}

export async function activatePatientConnection(db: Firestore, patientUid: string, connectionIdValue: string) {
  const connRef = db.collection("patientConnections").doc(connectionIdValue);
  const connSnap = await connRef.get();
  if (!connSnap.exists) throw new Error("conexao_invalida");
  const conn = mapConnectionDoc(connSnap.id, connSnap.data() || {});
  if (conn.patientUid !== patientUid) throw new Error("conexao_invalida");
  if (conn.status === "desconectada") throw new Error("conexao_desconectada");

  const active = await patientPortalActiveForConnection(db, conn.ownerUid, conn.patientId);
  if (!active) throw new Error("portal_desativado");

  const now = new Date().toISOString();
  await deactivateOtherActiveConnections(db, patientUid, connectionIdValue, now);

  await connRef.set({ status: "ativa", isActive: true, lastActivatedAt: now, deactivatedAt: null, updatedAt: now }, { merge: true });
  await syncAccountActivePointer(db, patientUid, { ...conn, status: "ativa", isActive: true, lastActivatedAt: now });
}

export async function deactivatePatientConnection(db: Firestore, patientUid: string, connectionIdValue: string) {
  const connRef = db.collection("patientConnections").doc(connectionIdValue);
  const connSnap = await connRef.get();
  if (!connSnap.exists) throw new Error("conexao_invalida");
  const conn = mapConnectionDoc(connSnap.id, connSnap.data() || {});
  if (conn.patientUid !== patientUid) throw new Error("conexao_invalida");

  const now = new Date().toISOString();
  await connRef.set({ status: "desativada", isActive: false, deactivatedAt: now, updatedAt: now }, { merge: true });

  if (conn.isActive) {
    await syncAccountActivePointer(db, patientUid, null);
    await setPatientCustomClaims(patientUid, "", "");
  }
}

export async function disconnectPatientConnection(db: Firestore, patientUid: string, connectionIdValue: string) {
  const connRef = db.collection("patientConnections").doc(connectionIdValue);
  const connSnap = await connRef.get();
  if (!connSnap.exists) throw new Error("conexao_invalida");
  const conn = mapConnectionDoc(connSnap.id, connSnap.data() || {});
  if (conn.patientUid !== patientUid) throw new Error("conexao_invalida");

  const now = new Date().toISOString();
  await connRef.set(
    { status: "desconectada", isActive: false, disconnectedAt: now, deactivatedAt: now, updatedAt: now },
    { merge: true }
  );

  const patientRef = db.collection("patients").doc(conn.patientId);
  const patientSnap = await patientRef.get();
  if (patientSnap.exists && patientSnap.data()?.patientAuthUid === patientUid) {
    await patientRef.set({ patientAuthUid: null, updatedAt: now }, { merge: true });
  }

  if (conn.isActive) {
    await syncAccountActivePointer(db, patientUid, null);
    await setPatientCustomClaims(patientUid, "", "");
  }
}

export async function patientPortalActiveForConnection(db: Firestore, ownerUid: string, patientId: string) {
  const snap = await db.collection("patients").doc(patientId).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (data.ownerUid !== ownerUid) return false;
  return data.portalAtivo === true;
}

export async function migrateLegacyAccountToConnections(db: Firestore, patientUid: string) {
  const accountSnap = await db.collection("patientAccounts").doc(patientUid).get();
  if (!accountSnap.exists) return;
  const data = accountSnap.data() || {};
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
  const patientId = typeof data.patientId === "string" ? data.patientId : "";
  if (!ownerUid || !patientId) return;

  const id = connectionId(patientUid, ownerUid, patientId);
  const connSnap = await db.collection("patientConnections").doc(id).get();
  if (connSnap.exists) return;

  const email = typeof data.email === "string" ? data.email : "";
  await linkPatientConnection({
    db,
    patientUid,
    email,
    ownerUid,
    patientId,
    skipEmailCheck: true,
    makeActive: true,
  });
}

type TransactionLinkContext = {
  patientUid: string;
  email: string;
  ownerUid: string;
  patientId: string;
  now: string;
};

async function writePatientConnectionInTransaction(
  db: Firestore,
  tx: FirebaseFirestore.Transaction,
  ctx: TransactionLinkContext
) {
  const email = normalizeEmail(ctx.email);
  const patientRef = db.collection("patients").doc(ctx.patientId);
  const patientSnap = await tx.get(patientRef);
  if (!patientSnap.exists || patientSnap.data()?.ownerUid !== ctx.ownerUid) {
    throw new Error("paciente_invalido");
  }
  if (patientSnap.data()?.portalAtivo !== true) {
    throw new Error("portal_desativado");
  }

  const memberRef = db.collection("members").doc(ctx.ownerUid);
  const memberSnap = await tx.get(memberRef);
  const memberData = memberSnap.data() || {};
  const profissionalNome = typeof memberData.nome === "string" ? memberData.nome : "Profissional";
  const profissionalEmail = typeof memberData.email === "string" ? memberData.email : "";
  const patientRecordNome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";

  const id = connectionId(ctx.patientUid, ctx.ownerUid, ctx.patientId);
  const connRef = db.collection("patientConnections").doc(id);
  const existing = await tx.get(connRef);

  await deactivateOtherActiveConnections(db, ctx.patientUid, id, ctx.now, tx);

  const payload = {
    patientUid: ctx.patientUid,
    ownerUid: ctx.ownerUid,
    patientId: ctx.patientId,
    status: "ativa" as PatientConnectionStatus,
    isActive: true,
    linkedAt: existing.exists ? (existing.data()?.linkedAt as string) || ctx.now : ctx.now,
    lastActivatedAt: ctx.now,
    deactivatedAt: null,
    disconnectedAt: null,
    profissionalNome,
    profissionalEmail,
    patientRecordNome,
    updatedAt: ctx.now,
  };

  tx.set(connRef, payload, { merge: true });
  tx.set(
    db.collection("patientAccounts").doc(ctx.patientUid),
    {
      email,
      ownerUid: ctx.ownerUid,
      patientId: ctx.patientId,
      activeConnectionId: id,
      updatedAt: ctx.now,
    },
    { merge: true }
  );
  tx.set(patientRef, { patientAuthUid: ctx.patientUid, updatedAt: ctx.now }, { merge: true });

  return { ownerUid: ctx.ownerUid, patientId: ctx.patientId, connectionId: id };
}

export async function acceptPortalInviteAndConnect(params: {
  db: Firestore;
  inviteToken: string;
  patientUid: string;
  email: string;
}) {
  const inviteRef = params.db.collection("portalInvites").doc(params.inviteToken);
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const result = await params.db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists) throw new Error("convite_invalido");
    const invite = inviteSnap.data() || {};
    const expiresAtMillis = Number(invite.expiresAtMillis) || 0;
    if (expiresAtMillis && expiresAtMillis <= nowMs) throw new Error("convite_expirado");
    if (invite.usedAtMillis) throw new Error("convite_usado");

    const ownerUid = typeof invite.ownerUid === "string" ? invite.ownerUid : "";
    const patientId = typeof invite.patientId === "string" ? invite.patientId : "";
    if (!ownerUid || !patientId) throw new Error("convite_invalido");

    const linkResult = await writePatientConnectionInTransaction(params.db, tx, {
      patientUid: params.patientUid,
      email: params.email,
      ownerUid,
      patientId,
      now,
    });

    tx.set(inviteRef, { usedAt: now, usedAtMillis: nowMs }, { merge: true });
    return linkResult;
  });

  await setPatientCustomClaims(params.patientUid, result.ownerUid, result.patientId);
  return result;
}

export async function redeemPatientLinkCodeAndConnect(params: {
  db: Firestore;
  codeInput: string;
  patientUid: string;
  email: string;
}) {
  const { hashLinkCode } = await import("./link-codes");
  const codeHash = hashLinkCode(params.codeInput);
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const result = await params.db.runTransaction(async (tx) => {
    const codeRef = params.db.collection("patientLinkCodes").doc(codeHash);
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists) throw new Error("codigo_invalido");
    const code = codeSnap.data() || {};
    const status = code.status;
    const expiresAtMillis = Number(code.expiresAtMillis) || 0;
    const ownerUid = typeof code.ownerUid === "string" ? code.ownerUid : "";
    const patientId = typeof code.patientId === "string" ? code.patientId : "";
    if (status !== "pendente" || !ownerUid || !patientId || expiresAtMillis <= nowMs) {
      throw new Error("codigo_invalido");
    }

    const linkResult = await writePatientConnectionInTransaction(params.db, tx, {
      patientUid: params.patientUid,
      email: params.email,
      ownerUid,
      patientId,
      now,
    });

    tx.set(codeRef, { status: "vinculado", usedAt: now, usedByUid: params.patientUid }, { merge: true });
    return linkResult;
  });

  await setPatientCustomClaims(params.patientUid, result.ownerUid, result.patientId);
  return result;
}

export async function psychologistUnlinkPortalAccount(db: Firestore, ownerUid: string, patientId: string) {
  const patientSnap = await db.collection("patients").doc(patientId).get();
  if (!patientSnap.exists || patientSnap.data()?.ownerUid !== ownerUid) {
    throw new Error("paciente_invalido");
  }
  const patientUid = typeof patientSnap.data()?.patientAuthUid === "string" ? patientSnap.data()!.patientAuthUid : "";
  if (!patientUid) return { unlinked: false };

  const id = connectionId(patientUid, ownerUid, patientId);
  await disconnectPatientConnection(db, patientUid, id);
  return { unlinked: true, patientUid };
}
