import { NextResponse } from "next/server";
import { bearerToken, verifyFirebaseIdToken } from "@/lib/server/verify-id-token";

export async function requireAuthUser(request: Request) {
  const idToken = bearerToken(request);
  if (!idToken) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  const identity = await verifyFirebaseIdToken(idToken);
  if (!identity) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  return { uid: identity.uid, email: identity.email, idToken };
}
