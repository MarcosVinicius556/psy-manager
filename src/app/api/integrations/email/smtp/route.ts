import { NextResponse } from "next/server";
import { requireEmailUser } from "@/lib/email-integration/api-auth";
import { encryptCredential, markConnected, readEmailIntegration } from "@/lib/email-integration/store";
import { isValidRecipientEmail, normalizeRecipientEmail } from "@/lib/email-integration/validate-email";

export const runtime = "nodejs";

const APP_PASSWORD_RE = /^[a-z0-9]{16}$/i;

export async function POST(request: Request) {
  const auth = await requireEmailUser(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as { address?: string; appPassword?: string };
  const address = typeof body.address === "string" ? normalizeRecipientEmail(body.address) : "";
  const appPassword = typeof body.appPassword === "string" ? body.appPassword.replace(/\s/g, "") : "";
  if (!isValidRecipientEmail(address)) {
    return NextResponse.json({ reason: "email_invalido" }, { status: 400 });
  }
  if (!APP_PASSWORD_RE.test(appPassword)) {
    return NextResponse.json({ reason: "senha_app_invalida" }, { status: 400 });
  }

  await markConnected(auth.uid, "gmail_smtp", address, {
    smtpPasswordEncrypted: encryptCredential(appPassword),
  });

  const record = await readEmailIntegration(auth.uid);
  return NextResponse.json({
    provider: record?.provider,
    connectedAddress: record?.connectedAddress,
    connectedAt: record?.connectedAt,
  });
}
