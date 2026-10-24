import { getFirebaseAuth } from "@/lib/admin/firebase";
import type { AppointmentInput } from "@/lib/admin/types";

export async function assertGoogleScheduleFree(candidate: Pick<AppointmentInput, "date" | "startTime" | "endTime" | "professionalId">) {
  if (!candidate.professionalId || !candidate.date || !candidate.startTime || !candidate.endTime) return;
  const user = getFirebaseAuth().currentUser;
  if (!user) return;
  const token = await user.getIdToken();
  const response = await fetch("/api/integrations/google-calendar/conflicts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      professionalId: candidate.professionalId,
      date: candidate.date,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
    }),
  });
  if (!response.ok) return;
  const data = (await response.json()) as { conflict?: boolean };
  if (data.conflict) {
    throw new Error("Este horário está ocupado no Google Agenda do profissional.");
  }
}
