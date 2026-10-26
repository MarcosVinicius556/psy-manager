/** Contador de leituras Firestore na sessão do navegador (só em desenvolvimento). */
let sessionReads = 0;

export function trackFirestoreReads(count: number) {
  if (!Number.isFinite(count) || count <= 0) return;
  sessionReads += count;
  if (process.env.NODE_ENV === "development") {
    console.debug(`[firestore] +${count} leituras (sessão: ${sessionReads})`);
  }
}

export function getSessionFirestoreReads() {
  return sessionReads;
}

export function resetSessionFirestoreReads() {
  sessionReads = 0;
}
