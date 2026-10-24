import { SESSION_IDLE_TIMEOUT_MS, SESSION_IDLE_WARNING_MS } from "./constants";

export type SessionIdlePhase = "active" | "warning" | "expired";

export function sessionIdlePhase(
  lastActivityAt: number,
  now: number,
  idleMs = SESSION_IDLE_TIMEOUT_MS,
  warningMs = SESSION_IDLE_WARNING_MS,
): SessionIdlePhase {
  const elapsed = now - lastActivityAt;
  if (elapsed >= idleMs + warningMs) return "expired";
  if (elapsed >= idleMs) return "warning";
  return "active";
}

export function sessionIdleSecondsLeft(
  lastActivityAt: number,
  now: number,
  idleMs = SESSION_IDLE_TIMEOUT_MS,
  warningMs = SESSION_IDLE_WARNING_MS,
): number {
  const expiresAt = lastActivityAt + idleMs + warningMs;
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function shouldTrackSessionIdle(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/feedback")) return false;
  return true;
}

export function loginPathForArea(pathname: string): string {
  return pathname.startsWith("/plataforma") ? "/plataforma/login" : "/admin/login";
}
