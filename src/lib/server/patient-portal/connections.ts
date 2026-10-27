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
  const snap = await db
    .collection("patientConnections")
    .where("patientUid", "==", patientUid)
    .where("status", "in", ["ativa", "desativada"])
    .limit(30)
    .get();
  return snap.docs
    .map((doc) => mapConnectionDoc(doc.id, doc.data()))
    .sort((a, b) => b.lastActivatedAt.localeCompare(a.lastActivatedAt));
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
  if (!params.skipEmailCheck && patientEmail && patientEmail !== email) {
    throw new Error("email_nao_confere");
  }

  const patientRecordNome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";
  const prof = await memberDisplay(params.db, params.ownerUid);
  const id = connectionId(params.patientUid, params.ownerUid, params.patientId);
  const existing = await params.db.collection("patientConnections").doc(id).get();

  const makeActive = params.makeActive !== false;
  if (makeActive) {
    const others = await params.db
      .collection("patientConnections")
      .where("patientUid", "==", params.patientUid)
      .where("isActive", "==", true)
      .limit(20)
      .get();
    await Promise.all(
      others.docs
        .filter((doc) => doc.id !== id)
        .map((doc) => doc.ref.set({ isActive: false, updatedAt: now }, { merge: true }))
    );
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
  const others = await db
    .collection("patientConnections")
    .where("patientUid", "==", patientUid)
    .where("isActive", "==", true)
    .limit(20)
    .get();
  await Promise.all(
    others.docs.map((doc) => doc.ref.set({ isActive: false, updatedAt: now }, { merge: true }))
  );

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
