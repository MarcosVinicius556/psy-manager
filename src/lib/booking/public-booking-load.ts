export type PublicBookingLoadPhase = "loading" | "ready" | "unavailable" | "error";

/** Maps a slug fetch result to the public booking page phase (before JSON parse). */
export function publicBookingLoadPhaseFromResponse(response: {
  ok: boolean;
  status: number;
}): Exclude<PublicBookingLoadPhase, "loading" | "ready"> | "ready" {
  if (response.status === 404) return "unavailable";
  if (!response.ok) return "error";
  return "ready";
}

export function publicBookingLoadPhaseFromNetworkFailure(): PublicBookingLoadPhase {
  return "error";
}
