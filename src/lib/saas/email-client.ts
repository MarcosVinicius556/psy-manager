export type EmailDelivery = { delivered: boolean; reason: string };

export async function deliverOperationalEmail(
  idToken: string,
  input: { kind: string; to: string; accountUid: string; subject: string; text: string }
): Promise<EmailDelivery> {
  const response = await fetch("/api/saas/email", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => null)) as { delivered?: boolean; reason?: string } | null;
  if (!response.ok) return { delivered: false, reason: data?.reason || "falha_envio" };
  return { delivered: Boolean(data?.delivered), reason: data?.reason || (data?.delivered ? "enviado" : "nao_confirmado") };
}

export async function deliverAdminEmail(
  idToken: string,
  input: { recipients: { to: string; accountUid: string }[]; subject: string; text: string; categoria: "operacional" | "produto" }
) {
  const response = await fetch("/api/saas/email", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "admin", ...input }),
  });
  const data = (await response.json().catch(() => null)) as { results?: { to: string; delivered: boolean; reason: string }[]; reason?: string } | null;
  if (!response.ok || !data?.results) {
    return input.recipients.map((item) => ({ to: item.to, delivered: false, reason: data?.reason || "falha_envio" }));
  }
  return data.results;
}
