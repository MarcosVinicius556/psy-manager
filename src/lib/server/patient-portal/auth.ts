/** Portal do paciente: leitura/escrita só via Admin SDK nestas rotas. O cliente não acessa Firestore (regras live não são deployadas). */
import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { claimsFromToken } from "@/lib/team/claims";
import { readIdTokenClaims } from "@/lib/server/team-access";
import { requireAuthUser } from "@/lib/server/require-auth";
import type { PatientAccountLink } from "./types";
import {
  getActiveConnection,
  linkPatientConnection,
  migrateLegacyAccountToConnections,
  patientPortalActiveForConnection,
} from "./connections";
import { ensurePatientUserDoc, normalizeEmail, setPatientCustomClaims } from "./account-utils";

export { normalizeEmail };

export async function loadPatientAccountLink(uid: string): Promise<PatientAccountLink | null> {
  const db = getAdminDb();
  if (!db) return null;
  await migrateLegacyAccountToConnections(db, uid);
  const snap = await db.collection("patientAccounts").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const email = typeof data.email === "string" ? normalizeEmail(data.email) : "";
  if (!email) return null;

  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
  const patientId = typeof data.patientId === "string" ? data.patientId : "";
  if (!ownerUid || !patientId) {
    return { uid, ownerUid: "", patientId: "", email, profileComplete: data.profileComplete === true };
  }
  return { uid, ownerUid, patientId, email, profileComplete: data.profileComplete === true };
}

export async function patientPortalActive(db: Firestore, ownerUid: string, patientId: string) {
  return patientPortalActiveForConnection(db, ownerUid, patientId);
}

export type PatientAuthSession = {
  link: PatientAccountLink;
  db: Firestore;
  uid: string;
  profileComplete: boolean;
};

export type PatientPortalSession = {
  db: Firestore;
  uid: string;
  email: string;
  profileComplete: boolean;
  account: FirebaseFirestore.DocumentData;
};

export async function requirePatientSession(request: Request): Promise<{ error: NextResponse } | PatientPortalSession> {
  const auth = await requireAuthUser(request);
  if ("error" in auth && auth.error) return { error: auth.error };

  const decoded = await readIdTokenClaims(auth.idToken);
  const staffOf = decoded ? claimsFromToken(decoded.claims as Record<string, unknown>).staffOf : null;
  if (staffOf) {
    return { error: NextResponse.json({ reason: "proibido" }, { status: 403 }) };
  }

  const db = getAdminDb();
  if (!db) return { error: NextResponse.json({ reason: "firebase_admin" }, { status: 503 }) };

  const accountSnap = await db.collection("patientAccounts").doc(auth.uid).get();
  if (!accountSnap.exists) {
    return { error: NextResponse.json({ reason: "conta_nao_registrada" }, { status: 403 }) };
  }

  const account = accountSnap.data() || {};
  const email =
    typeof account.email === "string"
      ? normalizeEmail(account.email)
      : auth.email
        ? normalizeEmail(auth.email)
        : "";
  if (email && auth.email && normalizeEmail(auth.email) !== email) {
    return { error: NextResponse.json({ reason: "email_divergente" }, { status: 403 }) };
  }

  return {
    db,
    uid: auth.uid,
    email,
    profileComplete: account.profileComplete === true,
    account,
  };
}

export async function requirePatientAuth(request: Request): Promise<{ error: NextResponse } | PatientAuthSession> {
  const session = await requirePatientSession(request);
  if ("error" in session) return session;

  const link = await loadPatientAccountLink(session.uid);
  if (!link?.ownerUid || !link.patientId) {
    return { error: NextResponse.json({ reason: "conta_nao_vinculada" }, { status: 403 }) };
  }

  const active = await patientPortalActive(session.db, link.ownerUid, link.patientId);
  if (!active) {
    return { error: NextResponse.json({ reason: "portal_desativado" }, { status: 403 }) };
  }

  const conn = await getActiveConnection(session.db, session.uid);
  if (!conn || conn.status !== "ativa") {
    return { error: NextResponse.json({ reason: "conexao_inativa" }, { status: 403 }) };
  }

  return {
    link: { uid: session.uid, ownerUid: link.ownerUid, patientId: link.patientId, email: link.email },
    db: session.db,
    uid: session.uid,
    profileComplete: session.profileComplete,
  };
}

export { setPatientCustomClaims, ensurePatientUserDoc };

export async function linkPatientAccount(params: {
  db: Firestore;
  uid: string;
  email: string;
  ownerUid: string;
  patientId: string;
  skipEmailCheck?: boolean;
}) {
  const email = normalizeEmail(params.email);
  await ensurePatientUserDoc(params.db, params.uid, email);
  await linkPatientConnection({
    db: params.db,
    patientUid: params.uid,
    email,
    ownerUid: params.ownerUid,
    patientId: params.patientId,
    skipEmailCheck: params.skipEmailCheck,
    makeActive: true,
  });
}
