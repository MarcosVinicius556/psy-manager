/** Tempo sem interação antes do aviso de expiração (30 minutos). */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Tempo do aviso antes do logout automático. */
export const SESSION_IDLE_WARNING_MS = 60 * 1000;

export const SESSION_IDLE_STORAGE_KEY = "psy-session-idle-last";

export const SESSION_IDLE_CHANNEL = "psy-session-idle";

export const MFA_ISSUER = "Psy Manager";
