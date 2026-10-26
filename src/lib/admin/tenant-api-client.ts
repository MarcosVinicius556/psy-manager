import { authorizedHeaders } from "./api-auth";
import { isDelegatedTenantAccess } from "@/lib/team/workspace-owner";
import type { PatientPrivateFields } from "./patient-private";

export { isDelegatedTenantAccess };

async function tenantGet<T>(path: string, query?: Record<string, string>) {
  const headers = await authorizedHeaders();
  const url = new URL(path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString(), { headers });
  if (!response.ok) throw new Error(`tenant_api_${response.status}`);
  return (await response.json()) as T;
}

async function tenantWrite<T>(method: string, path: string, body: unknown) {
  const headers = await authorizedHeaders({ "Content-Type": "application/json" });
  const response = await fetch(path, { method, headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`tenant_api_${response.status}`);
  return (await response.json()) as T;
}

export async function fetchTenantCollectionDocs(name: string, query?: Record<string, string>) {
  const payload = await tenantGet<{ docs: { id: string; data: Record<string, unknown> }[] }>(
    `/api/tenant/${name}`,
    query
  );
  return payload.docs;
}

export async function tenantCreateDoc(name: string, data: Record<string, unknown>) {
  const payload = await tenantWrite<{ id: string }>("POST", `/api/tenant/${name}`, data);
  return payload.id;
}

export async function tenantPatchDoc(name: string, id: string, data: Record<string, unknown>) {
  await tenantWrite<{ id: string }>("PATCH", `/api/tenant/${name}/${id}`, data);
}

export async function fetchPatientPrivateApi(patientId: string): Promise<PatientPrivateFields> {
  const headers = await authorizedHeaders();
  const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/private`, { headers });
  if (response.status === 404) return { observacoes: "", contatoEmergencia: "" };
  if (!response.ok) throw new Error(`patient_private_${response.status}`);
  const payload = (await response.json()) as { fields: PatientPrivateFields };
  return payload.fields;
}

export async function savePatientPrivateApi(patientId: string, fields: PatientPrivateFields) {
  const headers = await authorizedHeaders({ "Content-Type": "application/json" });
  const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/private`, {
    method: "PUT",
    headers,
    body: JSON.stringify(fields),
  });
  if (!response.ok) throw new Error(`patient_private_${response.status}`);
}
