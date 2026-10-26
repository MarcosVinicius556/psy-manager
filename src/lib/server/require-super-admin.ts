import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "./require-auth";

export async function requireSuperAdmin(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return { error: auth.error };
  const db = getAdminDb();
  if (!db) {
    return { error: NextResponse.json({ reason: "admin_indisponivel" }, { status: 503 }) };
  }
  const snap = await db.collection("users").doc(auth.uid).get();
  const role = snap.data()?.role;
  if (role !== "super_admin") {
    return { error: NextResponse.json({ reason: "sem_permissao" }, { status: 403 }) };
  }
  return { uid: auth.uid, email: auth.email, idToken: auth.idToken, db };
}
