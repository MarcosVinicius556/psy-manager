import type { Firestore } from "firebase-admin/firestore";
import type { StaffPermission, WorkspaceContext } from "@/lib/team/types";
import { staffHasPerm } from "./team-access";

type SecretaryGate = { ok: true; db: Firestore; ownerUid: string } | { ok: false; error: "indisponivel" | "proibido" };

function denyUnless(db: Firestore | null, workspace: WorkspaceContext, perm: StaffPermission): SecretaryGate {
  if (!db) return { ok: false, error: "indisponivel" };
  if (workspace.kind !== "secretaria") return { ok: false, error: "proibido" };
  if (!staffHasPerm(workspace, perm)) return { ok: false, error: "proibido" };
  return { ok: true, db, ownerUid: workspace.tenantOwnerUid };
}

function stripPatientAdmin(data: Record<string, unknown>) {
  const { observacoes: _o, contatoEmergencia: _c, ...rest } = data;
  return rest;
}

export async function secretaryListPatients(db: Firestore, workspace: WorkspaceContext) {
  const gate = denyUnless(db, workspace, "pacientes");
  if (!gate.ok) return { error: gate.error };
  const snap = await gate.db.collection("patients").where("ownerUid", "==", gate.ownerUid).get();
  return { docs: snap.docs.map((doc) => ({ id: doc.id, data: stripPatientAdmin(doc.data()) })) };
}

export async function secretaryListPayments(
  db: Firestore,
  workspace: WorkspaceContext,
  startMillis?: number,
  endMillis?: number
) {
  const gate = denyUnless(db, workspace, "financeiro");
  if (!gate.ok) return { error: gate.error };
  let query = gate.db.collection("payments").where("ownerUid", "==", gate.ownerUid);
  if (typeof startMillis === "number" && typeof endMillis === "number") {
    query = query.where("dueDateMillis", ">=", startMillis).where("dueDateMillis", "<=", endMillis);
  }
  const snap = await query.get();
  return { docs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })) };
}

export async function secretaryListAppointments(
  db: Firestore,
  workspace: WorkspaceContext,
  startMillis: number,
  endMillis: number
) {
  const gate = denyUnless(db, workspace, "agenda");
  if (!gate.ok) return { error: gate.error };
  const snap = await gate.db
    .collection("appointments")
    .where("ownerUid", "==", gate.ownerUid)
    .where("sessionStartMillis", ">=", startMillis)
    .where("sessionStartMillis", "<=", endMillis)
    .get();
  return { docs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })) };
}

export async function secretaryListMembers(db: Firestore, workspace: WorkspaceContext) {
  const gate = denyUnless(db, workspace, "agenda");
  if (!gate.ok) {
    const gatePac = denyUnless(db, workspace, "pacientes");
    if (!gatePac.ok) return { error: gatePac.error };
    const snap = await gatePac.db.collection("members").where("ownerUid", "==", gatePac.ownerUid).get();
    return { docs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })) };
  }
  const snap = await gate.db.collection("members").where("ownerUid", "==", gate.ownerUid).get();
  return { docs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })) };
}

export async function secretaryListNotifications(db: Firestore, workspace: WorkspaceContext) {
  const gate = denyUnless(db, workspace, "financeiro");
  if (!gate.ok) return { error: gate.error };
  const snap = await gate.db.collection("notifications").where("ownerUid", "==", gate.ownerUid).get();
  return { docs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })) };
}

export async function secretaryListPackages(db: Firestore, workspace: WorkspaceContext) {
  const gate = denyUnless(db, workspace, "financeiro");
  if (!gate.ok) return { error: gate.error };
  const snap = await gate.db.collection("packages").where("ownerUid", "==", gate.ownerUid).get();
  return { docs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })) };
}

export async function secretaryUpsertPatient(
  db: Firestore,
  workspace: WorkspaceContext,
  patientId: string | null,
  payload: Record<string, unknown>
) {
  const gate = denyUnless(db, workspace, "pacientes");
  if (!gate.ok) return { error: gate.error };
  const data = stripPatientAdmin(payload);
  if (patientId) {
    const ref = gate.db.collection("patients").doc(patientId);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.ownerUid !== gate.ownerUid) return { error: "nao_encontrado" as const };
    await ref.update(data);
    return { id: patientId };
  }
  const ref = await gate.db.collection("patients").add({
    ...data,
    ownerUid: gate.ownerUid,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}

export async function secretaryUpsertAppointment(
  db: Firestore,
  workspace: WorkspaceContext,
  appointmentId: string | null,
  payload: Record<string, unknown>
) {
  const gate = denyUnless(db, workspace, "agenda");
  if (!gate.ok) return { error: gate.error };
  if (payload.clinical !== undefined) return { error: "proibido" as const };
  const data: Record<string, unknown> = { ...payload, ownerUid: gate.ownerUid };
  delete data.clinical;
  if (appointmentId) {
    const ref = gate.db.collection("appointments").doc(appointmentId);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.ownerUid !== gate.ownerUid) return { error: "nao_encontrado" as const };
    await ref.update({ ...data, updatedAt: new Date().toISOString() });
    return { id: appointmentId };
  }
  const now = new Date().toISOString();
  const ref = await gate.db.collection("appointments").add({
    ...data,
    createdAt: now,
    updatedAt: now,
    accessUids: Array.isArray(data.accessUids) ? (data.accessUids as string[]) : [gate.ownerUid],
  });
  return { id: ref.id };
}

export async function secretaryUpsertPayment(
  db: Firestore,
  workspace: WorkspaceContext,
  paymentId: string | null,
  payload: Record<string, unknown>
) {
  const gate = denyUnless(db, workspace, "financeiro");
  if (!gate.ok) return { error: gate.error };
  const data = { ...payload, ownerUid: gate.ownerUid };
  if (paymentId) {
    const ref = gate.db.collection("payments").doc(paymentId);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.ownerUid !== gate.ownerUid) return { error: "nao_encontrado" as const };
    await ref.update(data);
    return { id: paymentId };
  }
  const ref = await gate.db.collection("payments").add({
    ...data,
    createdAt: new Date().toISOString(),
  });
  return { id: ref.id };
}
