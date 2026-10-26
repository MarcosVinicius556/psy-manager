import type { ClinicMember, PixKeyType } from "./types";

export const MEMBER_PRIVATE_FIELD_KEYS = [
  "cpf",
  "crpNumero",
  "crpRegiao",
  "enderecoLogradouro",
  "enderecoCidade",
  "enderecoUf",
  "enderecoCep",
  "pixChave",
  "pixTipo",
  "pixNome",
  "pixCidade",
] as const;

export type MemberPrivateFields = Pick<ClinicMember, (typeof MEMBER_PRIVATE_FIELD_KEYS)[number]>;

export function emptyMemberPrivateFields(): MemberPrivateFields {
  return {
    cpf: "",
    crpNumero: "",
    crpRegiao: "",
    enderecoLogradouro: "",
    enderecoCidade: "",
    enderecoUf: "",
    enderecoCep: "",
    pixChave: "",
    pixTipo: "",
    pixNome: "",
    pixCidade: "",
  };
}

function pixTipo(value: unknown): PixKeyType {
  const text = typeof value === "string" ? value : "";
  return text === "cpf" || text === "cnpj" || text === "email" || text === "telefone" || text === "aleatoria" ? text : "";
}

export function pickMemberPrivateFields(member: Partial<ClinicMember>): MemberPrivateFields {
  return {
    cpf: member.cpf ?? "",
    crpNumero: member.crpNumero ?? "",
    crpRegiao: member.crpRegiao ?? "",
    enderecoLogradouro: member.enderecoLogradouro ?? "",
    enderecoCidade: member.enderecoCidade ?? "",
    enderecoUf: member.enderecoUf ?? "",
    enderecoCep: member.enderecoCep ?? "",
    pixChave: member.pixChave ?? "",
    pixTipo: member.pixTipo ?? "",
    pixNome: member.pixNome ?? "",
    pixCidade: member.pixCidade ?? "",
  };
}

export function stripMemberPrivateFields<T extends Record<string, unknown>>(data: T) {
  const copy = { ...data };
  for (const key of MEMBER_PRIVATE_FIELD_KEYS) delete copy[key];
  return copy;
}

export function mapMemberPrivateData(data: Record<string, unknown>): MemberPrivateFields {
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    cpf: text(data.cpf),
    crpNumero: text(data.crpNumero),
    crpRegiao: text(data.crpRegiao),
    enderecoLogradouro: text(data.enderecoLogradouro),
    enderecoCidade: text(data.enderecoCidade),
    enderecoUf: text(data.enderecoUf),
    enderecoCep: text(data.enderecoCep),
    pixChave: text(data.pixChave),
    pixTipo: pixTipo(data.pixTipo),
    pixNome: text(data.pixNome),
    pixCidade: text(data.pixCidade),
  };
}
