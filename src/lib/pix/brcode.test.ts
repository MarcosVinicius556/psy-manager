import { describe, expect, it } from "vitest";
import { buildStaticPixBrcode, crc16Ccitt, normalizePixKeyForBrcode } from "./brcode";

const VALID_CPF = "52998224725";
const VALID_CNPJ = "11222333000181";
const EVP = "123e4567-e12b-12d1-a456-426655440000";

function assertCrcValid(code: string) {
  const crcTag = code.lastIndexOf("6304");
  expect(crcTag).toBeGreaterThan(0);
  const body = code.slice(0, crcTag + 4);
  const crc = code.slice(crcTag + 4);
  expect(crc).toBe(crc16Ccitt(body));
  expect(crc).toHaveLength(4);
}

function buildAndAssertKey(key: string, expectedInPayload: string, keyType?: Parameters<typeof buildStaticPixBrcode>[0]["keyType"]) {
  const code = buildStaticPixBrcode({
    key,
    keyType,
    amount: 1,
    merchantName: "Recebedor",
    merchantCity: "Sao Paulo",
    txid: "TX1",
  });
  expect(code.startsWith("000201")).toBe(true);
  expect(code).toContain("br.gov.bcb.pix");
  expect(code).toContain(expectedInPayload);
  expect(code).not.toContain("+55" + VALID_CPF);
  assertCrcValid(code);
  return code;
}

describe("crc16Ccitt", () => {
  it("confere CRC16-CCITT para payload de referência", () => {
    const sample =
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913NOME DO RECE6008BRASILIA62070503***6304";
    expect(crc16Ccitt(sample)).toBe("3287");
  });
});

describe("normalizePixKeyForBrcode", () => {
  it("mantém CPF só com dígitos", () => {
    expect(normalizePixKeyForBrcode("529.982.247-25", "cpf")).toBe(VALID_CPF);
    expect(normalizePixKeyForBrcode(VALID_CPF)).toBe(VALID_CPF);
  });

  it("normaliza telefone para +55", () => {
    expect(normalizePixKeyForBrcode("11999998888", "telefone")).toBe("+5511999998888");
    expect(normalizePixKeyForBrcode("+5511999998888", "telefone")).toBe("+5511999998888");
  });
});

describe("buildStaticPixBrcode", () => {
  it("monta payload com GUI, chave, valor e CRC válido", () => {
    const code = buildStaticPixBrcode({
      key: EVP,
      amount: 10,
      merchantName: "Nome do Recebedor",
      merchantCity: "BRASILIA",
      txid: "***",
    });
    expect(code.startsWith("000201")).toBe(true);
    expect(code).toContain("br.gov.bcb.pix");
    expect(code).toContain(EVP);
    expect(code).toContain("540510.00");
    assertCrcValid(code);
  });

  it("normaliza telefone para +55", () => {
    const code = buildStaticPixBrcode({
      key: "11999998888",
      keyType: "telefone",
      merchantName: "Ana",
      merchantCity: "Sao Paulo",
    });
    expect(code).toContain("+5511999998888");
    assertCrcValid(code);
  });

  it("embarca chave CPF sem prefixo de telefone", () => {
    const code = buildAndAssertKey(VALID_CPF, VALID_CPF, "cpf");
    expect(code).not.toContain(`+55${VALID_CPF}`);
  });

  it("embarca chave CNPJ só com dígitos", () => {
    buildAndAssertKey("11.222.333/0001-81", VALID_CNPJ, "cnpj");
  });

  it("embarca e-mail em minúsculas", () => {
    buildAndAssertKey("Pagador@Example.COM", "pagador@example.com", "email");
  });

  it("embarca EVP inalterada (minúscula)", () => {
    buildAndAssertKey(EVP.toUpperCase(), EVP, "aleatoria");
  });

  it("respeita tipo telefone explícito mesmo para 11 dígitos com formato de CPF", () => {
    const code = buildStaticPixBrcode({
      key: VALID_CPF,
      keyType: "telefone",
      merchantName: "Ana",
      merchantCity: "Sao Paulo",
    });
    expect(code).toContain(`+55${VALID_CPF}`);
    assertCrcValid(code);
  });
});
