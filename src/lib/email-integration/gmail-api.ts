import { exchangeCodeForTokens, fetchGoogleEmail, revokeRefreshToken } from "@/lib/google-calendar/google-api";
import { decryptCredential, encryptCredential, readEmailIntegration, writeEmailIntegration } from "./store";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
};

export { exchangeCodeForTokens, fetchGoogleEmail, revokeRefreshToken };

export async function refreshGmailAccessToken(uid: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("oauth_nao_configurado");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error("refresh_falhou");
  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) throw new Error("refresh_sem_token");
  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000 - 60_000;
  await writeEmailIntegration(uid, {
    accessTokenEncrypted: encryptCredential(data.access_token),
    accessTokenExpiresAt: expiresAt,
  });
  return data.access_token;
}

export async function getGmailAccessToken(uid: string) {
  const record = await readEmailIntegration(uid);
  if (!record?.refreshTokenEncrypted || record.provider !== "gmail_oauth") throw new Error("nao_conectado");
  const refreshToken = decryptCredential(record.refreshTokenEncrypted);
  if (record.accessTokenEncrypted && record.accessTokenExpiresAt && record.accessTokenExpiresAt > Date.now()) {
    return decryptCredential(record.accessTokenEncrypted);
  }
  return refreshGmailAccessToken(uid, refreshToken);
}

export async function sendViaGmailApi(uid: string, rawBase64Url: string) {
  const accessToken = await getGmailAccessToken(uid);
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: rawBase64Url }),
  });
  if (!response.ok) throw new Error("gmail_send_falhou");
}
