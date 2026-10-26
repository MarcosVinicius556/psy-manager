import { describe, expect, it } from "vitest";
import { buildStaticPixBrcode, crc16Ccitt } from "./brcode";

describe("crc16Ccitt", () => {
  it("confere CRC16-CCITT para payload de referência", () => {
    const sample =
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913NOME DO RECE6008BRASILIA62070503***6304";
    expect(crc16Ccitt(sample)).toBe("3287");
  });
});

describe("buildStaticPixBrcode", () => {
  it("monta payload com GUI, chave, valor e CRC válido", () => {
    const code = buildStaticPixBrcode({
      key: "123e4567-e12b-12d1-a456-426655440000",
      amount: 10,
      merchantName: "Nome do Recebedor",
      merchantCity: "BRASILIA",
      txid: "***",
    });
    expect(code.startsWith("000201")).toBe(true);
    expect(code).toContain("br.gov.bcb.pix");
    expect(code).toContain("123e4567-e12b-12d1-a456-426655440000");
    expect(code).toContain("540510.00");
    const crcTag = code.lastIndexOf("6304");
    expect(crcTag).toBeGreaterThan(0);
    const body = code.slice(0, crcTag + 4);
    const crc = code.slice(crcTag + 4);
    expect(crc).toBe(crc16Ccitt(body));
    expect(crc).toHaveLength(4);
  });

  it("normaliza telefone para +55", () => {
    const code = buildStaticPixBrcode({
      key: "11999998888",
      merchantName: "Ana",
      merchantCity: "Sao Paulo",
    });
    expect(code).toContain("+5511999998888");
  });
});
