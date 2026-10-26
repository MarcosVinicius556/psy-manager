import type { FormFieldDef } from "@/lib/admin/form-types";

export const FORM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function formExpired(data: Record<string, unknown>) {
  const millis = Number(data.expiresAtMillis);
  if (Number.isFinite(millis) && millis > 0) return millis <= Date.now();
  const iso = typeof data.expiresAt === "string" ? data.expiresAt : "";
  if (!iso) return false;
  return Date.parse(iso) <= Date.now();
}

export function formAnswered(data: Record<string, unknown>) {
  return Boolean(data.answeredAt || data.answeredAtMillis);
}

function mapField(value: unknown): FormFieldDef | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const label = typeof row.label === "string" ? row.label : "";
  const type = typeof row.type === "string" ? row.type : "text";
  if (!id || !label) return null;
  const allowed = ["text", "textarea", "select", "date", "checkbox"];
  if (!allowed.includes(type)) return null;
  const options = Array.isArray(row.options) ? row.options.filter((item): item is string => typeof item === "string") : undefined;
  return {
    id,
    label,
    type: type as FormFieldDef["type"],
    required: Boolean(row.required),
    placeholder: typeof row.placeholder === "string" ? row.placeholder : undefined,
    options,
    helpText: typeof row.helpText === "string" ? row.helpText : undefined,
  };
}

export function sanitizeFormAnswers(fields: FormFieldDef[], raw: Record<string, unknown>) {
  const answers: Record<string, string> = {};
  for (const field of fields) {
    const value = raw[field.id];
    const text = typeof value === "string" ? value.trim() : value === true ? "sim" : "";
    if (field.required && !text) {
      throw new Error(`missing:${field.id}`);
    }
    if (text) answers[field.id] = text.slice(0, 8000);
  }
  return answers;
}

export function toPublicFormView(data: Record<string, unknown>) {
  const title = typeof data.templateNome === "string" ? data.templateNome : "Formulário";
  const finalidade = typeof data.finalidade === "string" ? data.finalidade : "";
  const version = Number(data.templateVersion) || 1;
  const fields = Array.isArray(data.campos) ? data.campos.map(mapField).filter(Boolean) : [];
  return {
    title,
    finalidade,
    version,
    fields: fields as FormFieldDef[],
    expired: formExpired(data),
    answered: formAnswered(data),
  };
}
