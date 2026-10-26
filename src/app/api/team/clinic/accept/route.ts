import { NextResponse } from "next/server";
import { acceptClinicInvite } from "@/lib/server/clinic-team-service";
import { requireAuthUser } from "@/lib/server/require-auth";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const nome = typeof body.nome === "string" ? body.nome : "";
  if (!token) return NextResponse.json({ error: "Token obrigatório." }, { status: 400 });

  const result = await acceptClinicInvite({
    token,
    uid: auth.uid,
    email: auth.email,
    nome,
  });
  if (!result.ok) return NextResponse.json({ reason: result.reason }, { status: 400 });
  return NextResponse.json({ success: true, clinicId: result.clinicId });
}
