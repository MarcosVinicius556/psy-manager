// texto sujeito a revisão jurídica

/** Dados cadastrais do controlador (conta/plataforma). Preencha antes do lançamento comercial. */
export const LEGAL_OWNER = {
  RAZAO_SOCIAL: "{{RAZAO_SOCIAL}}",
  CNPJ: "{{CNPJ}}",
  ENDERECO: "{{ENDERECO}}",
  ENCARREGADO_NOME: "{{ENCARREGADO_NOME}}",
  ENCARREGADO_EMAIL: "{{ENCARREGADO_EMAIL}}",
} as const;

export type LegalOwnerKey = keyof typeof LEGAL_OWNER;

const PLACEHOLDER_PATTERN = /^\{\{[A-Z_]+\}\}$/;

export function isPlaceholderValue(value: string) {
  return PLACEHOLDER_PATTERN.test(value.trim());
}

export function hasUnresolvedLegalPlaceholders() {
  return Object.values(LEGAL_OWNER).some((value) => isPlaceholderValue(value));
}

export type LegalDocumentId = "termos" | "privacidade" | "dpa" | "cookies" | "seguranca" | "suboperadores";

export type LegalAcceptanceDocument = "termos" | "privacidade" | "dpa";

export type LegalDocumentMeta = {
  id: LegalDocumentId;
  title: string;
  path: string;
  version: string;
  /** dd/mm/aaaa */
  effectiveFrom: string;
  /** Texto canônico para hash de aceite (sem HTML). */
  acceptanceSource: string;
};

export const COOKIE_CONSENT_VERSION = "1";

export const LEGAL_DOCUMENTS: Record<"termos" | "privacidade" | "dpa", LegalDocumentMeta> = {
  termos: {
    id: "termos",
    title: "Termos de Uso",
    path: "/termos",
    version: "2.0",
    effectiveFrom: "24/10/2026",
    acceptanceSource: "termos-2.0-2026-10-24",
  },
  privacidade: {
    id: "privacidade",
    title: "Política de Privacidade",
    path: "/privacidade",
    version: "2.0",
    effectiveFrom: "24/10/2026",
    acceptanceSource: "privacidade-2.0-2026-10-24",
  },
  dpa: {
    id: "dpa",
    title: "Acordo de Tratamento de Dados (DPA)",
    path: "/dpa",
    version: "1.0",
    effectiveFrom: "24/10/2026",
    acceptanceSource: "dpa-1.0-2026-10-24",
  },
};

/** Versão registrada no cadastro legado (campo users.termsVersion). */
export const TERMS_VERSION = LEGAL_DOCUMENTS.termos.version;

export function formatLegalVersionLine(meta: Pick<LegalDocumentMeta, "version" | "effectiveFrom">) {
  return `Versão ${meta.version} — vigente desde ${meta.effectiveFrom}`;
}

export function replaceLegalPlaceholders(text: string) {
  return text
    .replaceAll("{{RAZAO_SOCIAL}}", LEGAL_OWNER.RAZAO_SOCIAL)
    .replaceAll("{{CNPJ}}", LEGAL_OWNER.CNPJ)
    .replaceAll("{{ENDERECO}}", LEGAL_OWNER.ENDERECO)
    .replaceAll("{{ENCARREGADO_NOME}}", LEGAL_OWNER.ENCARREGADO_NOME)
    .replaceAll("{{ENCARREGADO_EMAIL}}", LEGAL_OWNER.ENCARREGADO_EMAIL);
}

export const LEGAL_FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/cookies", label: "Cookies" },
  { href: "/seguranca", label: "Segurança" },
  { href: "/suboperadores", label: "Suboperadores" },
  { href: "/dpa", label: "DPA" },
];
