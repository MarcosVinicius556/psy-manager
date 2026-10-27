/**
 * BR Code estático Pix (EMV QRCPS-MPM) — sem gateway.
 * Referência: Manual do BR Code v2.0.1 (Banco Central).
 */

import { inferPixKeyType, type PixKeyType } from "./keys";

export type StaticPixBrcodeInput = {
  /** Chave Pix (CPF/CNPJ só dígitos; e-mail; telefone +55…; EVP). */
  key: string;
  /** Tipo da chave; quando omitido, infere (11 dígitos: CPF válido ou telefone). */
  keyType?: PixKeyType;
  /** Valor em reais; omita ou 0 para QR sem valor fixo. */
  amount?: number;
  /** Nome do recebedor (máx. 25 caracteres). */
  merchantName: string;
  /** Cidade do recebedor (máx. 15 caracteres). */
  merchantCity: string;
  /** Identificador da cobrança (txid, máx. 25; padrão "***"). */
  txid?: string;
};

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC16-CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF). */
export function crc16Ccitt(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function asciiFold(input: string) {
  return input.normalize("NFD").replace(/\p{M}/gu, "");
}

function sanitizeField(input: string, max: number) {
  const folded = asciiFold(input)
    .replace(/[^\w\s@.\-+]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return folded.slice(0, max);
}

const EVP_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizePixKeyForBrcode(key: string, tipo?: PixKeyType) {
  const trimmed = key.trim();
  if (!trimmed) return "";
  const kind = tipo === "" || tipo === undefined ? inferPixKeyType(trimmed) : tipo;
  if (kind === "email") return trimmed.toLowerCase();
  if (kind === "aleatoria") return trimmed.toLowerCase();
  if (kind === "cpf" || kind === "cnpj") return trimmed.replace(/\D/g, "");
  if (kind === "telefone") {
    if (trimmed.startsWith("+")) return trimmed;
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
    return digits ? `+${digits}` : trimmed;
  }
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  if (EVP_PATTERN.test(trimmed)) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  return digits || trimmed;
}

export function buildStaticPixBrcode(input: StaticPixBrcodeInput) {
  const key = normalizePixKeyForBrcode(input.key, input.keyType);
  if (!key) throw new Error("Informe a chave Pix.");

  const merchantAccount = tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", key));
  let payload = tlv("00", "01") + merchantAccount;
  payload += tlv("52", "0000");
  payload += tlv("53", "986");
  if (input.amount != null && input.amount > 0) {
    payload += tlv("54", input.amount.toFixed(2));
  }
  payload += tlv("58", "BR");
  payload += tlv("59", sanitizeField(input.merchantName || "RECEBEDOR", 25));
  payload += tlv("60", sanitizeField(input.merchantCity || "BRASILIA", 15));
  const txid = (input.txid?.trim() || "***").slice(0, 25);
  payload += tlv("62", tlv("05", txid));
  const withCrcTag = `${payload}6304`;
  return `${withCrcTag}${crc16Ccitt(withCrcTag)}`;
}
