import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 15 * 60 * 1000;

type StatePayload = {
  uid: string;
  nonce: string;
  exp: number;
};

function signingKey() {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY ausente");
  return raw;
}

function sign(body: string) {
  return createHmac("sha256", signingKey()).update(body).digest("base64url");
}

export function createOAuthState(uid: string, nonce: string, now = Date.now()) {
  const payload: StatePayload = { uid, nonce, exp: now + TTL_MS };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifyOAuthState(state: string, expectedUid: string, expectedNonce: string, now = Date.now()) {
  const [body, signature] = state.split(".");
  if (!body || !signature) return { ok: false as const, reason: "formato" };
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false as const, reason: "assinatura" };
  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as StatePayload;
  } catch {
    return { ok: false as const, reason: "payload" };
  }
  if (payload.uid !== expectedUid) return { ok: false as const, reason: "uid" };
  if (payload.nonce !== expectedNonce) return { ok: false as const, reason: "nonce" };
  if (payload.exp < now) return { ok: false as const, reason: "expirado" };
  return { ok: true as const, payload };
}
