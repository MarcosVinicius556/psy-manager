import { decryptAccessToken, decryptRefreshToken, encryptAccessToken, readIntegration, writeIntegration } from "./store";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
};

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("oauth_nao_configurado");
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error("troca_token_falhou");
  return (await response.json()) as TokenResponse;
}

export async function refreshAccessToken(uid: string, refreshToken: string) {
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
  await writeIntegration(uid, {
    accessTokenEncrypted: encryptAccessToken(data.access_token),
    accessTokenExpiresAt: expiresAt,
  });
  return data.access_token;
}

export async function getValidAccessToken(uid: string) {
  const record = await readIntegration(uid);
  if (!record?.refreshTokenEncrypted) throw new Error("nao_conectado");
  const refreshToken = decryptRefreshToken(record.refreshTokenEncrypted);
  if (record.accessTokenEncrypted && record.accessTokenExpiresAt && record.accessTokenExpiresAt > Date.now()) {
    return decryptAccessToken(record.accessTokenEncrypted);
  }
  return refreshAccessToken(uid, refreshToken);
}

export async function revokeRefreshToken(refreshToken: string) {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(refreshToken)}`, { method: "POST" });
  } catch {
    // best effort
  }
}

export async function fetchGoogleEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return "";
  const data = (await response.json()) as { email?: string };
  return data.email?.toLowerCase() || "";
}

export type GoogleCalendarListItem = { id: string; summary: string; primary?: boolean };

export async function listCalendars(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("listar_calendarios_falhou");
  const data = (await response.json()) as { items?: { id?: string; summary?: string; primary?: boolean }[] };
  return (data.items || [])
    .filter((item) => item.id && item.summary)
    .map((item) => ({ id: item.id!, summary: item.summary!, primary: item.primary }));
}

export async function createCalendarEvent(accessToken: string, calendarId: string, body: Record<string, unknown>) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("criar_evento_falhou");
  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error("evento_sem_id");
  return data.id;
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) throw new Error("atualizar_evento_falhou");
}

export async function deleteCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status !== 204 && response.status !== 410 && !response.ok) throw new Error("excluir_evento_falhou");
}

export async function listCalendarEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("listar_eventos_falhou");
  const data = (await response.json()) as {
    items?: { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }[];
  };
  return (data.items || [])
    .map((item) => {
      const start = item.start?.dateTime || (item.start?.date ? `${item.start.date}T00:00:00` : "");
      const end = item.end?.dateTime || (item.end?.date ? `${item.end.date}T23:59:00` : "");
      if (!start || !end) return null;
      return { summary: item.summary || "Ocupado", start, end };
    })
    .filter((item): item is { summary: string; start: string; end: string } => Boolean(item));
}

export async function fetchFreeBusy(accessToken: string, calendarId: string, timeMin: string, timeMax: string) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    }),
  });
  if (!response.ok) throw new Error("freebusy_falhou");
  const data = (await response.json()) as {
    calendars?: Record<string, { busy?: { start?: string; end?: string }[] }>;
  };
  const busy = data.calendars?.[calendarId]?.busy || [];
  return busy.filter((item) => item.start && item.end).map((item) => ({ start: item.start!, end: item.end! }));
}
