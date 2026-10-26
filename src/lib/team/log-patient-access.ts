import { authorizedHeaders } from "@/lib/admin/api-auth";

export async function logPatientAdminAccess(patientId: string, actorNome: string) {
  try {
    const headers = await authorizedHeaders({ "Content-Type": "application/json" });
    await fetch("/api/team/access-log", {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId, actorNome, area: "paciente_admin" }),
    });
  } catch {
    // best-effort
  }
}
