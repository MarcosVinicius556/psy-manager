/** Portal do paciente: leitura/escrita só via Admin SDK nestas rotas. O cliente não acessa Firestore (regras live não são deployadas). */
import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import type { PatientAccountLink } from "./types";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function loadPatientAccountLink(uid: string): Promise<PatientAccountLink | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("patientAccounts").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
  const patientId = typeof data.patientId === "string" ? data.patientId : "";
  const email = typeof data.email === "string" ? normalizeEmail(data.email) : "";
  if (!ownerUid || !patientId || !email) return null;
  return { uid, ownerUid, patientId, email };
}

export async function patientPortalActive(db: Firestore, ownerUid: string, patientId: string) {
  const snap = await db.collection("patients").doc(patientId).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (data.ownerUid !== ownerUid) return false;
  return data.portalAtivo === true;
}

export async function requirePatientAuth(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return { error: auth.error };

  const link = await loadPatientAccountLink(auth.uid);
  if (!link) {
    return { error: NextResponse.json({ reason: "conta_nao_vinculada" }, { status: 403 }) };
  }
  if (normalizeEmail(auth.email) && normalizeEmail(auth.email) !== link.email) {
    return { error: NextResponse.json({ reason: "email_divergente" }, { status: 403 }) };
  }

  const db = getAdminDb();
  if (!db) return { error: NextResponse.json({ reason: "firebase_admin" }, { status: 503 }) };

  const active = await patientPortalActive(db, link.ownerUid, link.patientId);
  if (!active) {
    return { error: NextResponse.json({ reason: "portal_desativado" }, { status: 403 }) };
  }

  return { link, db, uid: auth.uid };
}

export async function setPatientCustomClaims(uid: string, ownerUid: string, patientId: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) return;
  await adminAuth.setCustomUserClaims(uid, {
    role: "paciente",
    patientOf: { ownerUid, patientId },
  });
}

export async function ensurePatientUserDoc(db: Firestore, uid: string, email: string) {
  const now = new Date().toISOString();
  await db.collection("users").doc(uid).set(
    {
      uid,
      email: normalizeEmail(email),
      role: "paciente",
      billingAccess: "legado",
      subscriptionStatus: "legado",
      accountStatus: "ativa",
      pushPrefs: {
        sessoes: true,
        documentos: true,
        diario: true,
        escalas: true,
        silencioNoturno: true,
      },
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function linkPatientAccount(params: {
  db: Firestore;
  uid: string;
  email: string;
  ownerUid: string;
  patientId: string;
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
  if (patientEmail && patientEmail !== email) {
    throw new Error("email_nao_confere");
  }

  await params.db.collection("patientAccounts").doc(params.uid).set({
    ownerUid: params.ownerUid,
    patientId: params.patientId,
    email,
    createdAt: now,
    updatedAt: now,
  });

  await patientRef.set({ patientAuthUid: params.uid, updatedAt: now }, { merge: true });
  await ensurePatientUserDoc(params.db, params.uid, email);
  await setPatientCustomClaims(params.uid, params.ownerUid, params.patientId);
}
