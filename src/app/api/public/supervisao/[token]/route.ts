import { NextResponse } from "next/server";
import { readSupervisionShare } from "@/lib/server/supervision-service";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const data = await readSupervisionShare(token);
  if (!data) return NextResponse.json({ reason: "expirado_ou_invalido" }, { status: 404 });
  return NextResponse.json({
    payload: data.payload,
    expiresAtMillis: data.expiresAtMillis,
    createdAt: data.createdAt,
  });
}
