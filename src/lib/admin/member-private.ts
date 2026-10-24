import type { ClinicMember } from "./types";

export const MEMBER_PRIVATE_FIELD_KEYS = [
  "cpf",
  "crpNumero",
  "crpRegiao",
  "enderecoLogradouro",
  "enderecoCidade",
  "enderecoUf",
  "enderecoCep",
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
  };
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
  };
}
