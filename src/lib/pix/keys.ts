export type PixKeyType = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria" | "";

export const PIX_KEY_TYPE_OPTIONS: { value: PixKeyType; label: string }[] = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Celular" },
  { value: "aleatoria", label: "Chave aleatória" },
];

const EVP_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function inferPixKeyType(key: string): PixKeyType {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return "email";
  if (EVP_PATTERN.test(trimmed)) return "aleatoria";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 14) return "cnpj";
  if (digits.length === 11) return "cpf";
  if (trimmed.startsWith("+") || digits.length >= 10) return "telefone";
  return "";
}

export function validatePixKey(key: string, tipo?: PixKeyType) {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, reason: "Informe a chave Pix." };
  const kind = tipo ? tipo : inferPixKeyType(trimmed);
  if (kind === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { ok: false, reason: "E-mail inválido." };
    return { ok: true, tipo: kind };
  }
  if (kind === "aleatoria") {
    if (!EVP_PATTERN.test(trimmed)) return { ok: false, reason: "Chave aleatória inválida." };
    return { ok: true, tipo: kind };
  }
  if (kind === "cpf") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 11) return { ok: false, reason: "CPF deve ter 11 dígitos." };
    return { ok: true, tipo: kind };
  }
  if (kind === "cnpj") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 14) return { ok: false, reason: "CNPJ deve ter 14 dígitos." };
    return { ok: true, tipo: kind };
  }
  if (kind === "telefone") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 10) return { ok: false, reason: "Telefone inválido." };
    return { ok: true, tipo: kind };
  }
  return { ok: false, reason: "Tipo de chave não reconhecido." };
}

export type PixProfile = {
  pixChave: string;
  pixTipo: PixKeyType;
  pixNome: string;
  pixCidade: string;
};

export function pixProfileReady(profile: Partial<PixProfile>) {
  const keyCheck = validatePixKey(profile.pixChave || "", profile.pixTipo);
  if (!keyCheck.ok) return { ok: false as const, missing: ["chave Pix válida"] };
  if (!profile.pixNome?.trim()) return { ok: false as const, missing: ["nome do recebedor Pix"] };
  if (!profile.pixCidade?.trim()) return { ok: false as const, missing: ["cidade do recebedor Pix"] };
  return { ok: true as const };
}
