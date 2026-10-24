import { describe, expect, it } from "vitest";
import { cpfDigits, isValidCpf } from "./cpf";

function buildCpf(baseNine: string) {
  const digits = baseNine.replace(/\D/g, "").slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  const withFirst = `${digits}${check}`;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(withFirst[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return `${withFirst}${check}`;
}

describe("cpfDigits", () => {
  it("remove máscara", () => {
    const sample = buildCpf("123456789");
    expect(cpfDigits(`${sample.slice(0, 3)}.${sample.slice(3, 6)}.${sample.slice(6, 9)}-${sample.slice(9)}`)).toBe(sample);
  });
});

describe("isValidCpf", () => {
  it("aceita CPF válido gerado", () => {
    const valid = buildCpf("529982247");
    expect(isValidCpf(valid)).toBe(true);
  });

  it("rejeita sequência repetida", () => {
    expect(isValidCpf("11111111111")).toBe(false);
  });

  it("rejeita dígito verificador errado", () => {
    const valid = buildCpf("390533447");
    const wrong = `${valid.slice(0, 10)}${valid.endsWith("0") ? "1" : "0"}`;
    expect(isValidCpf(wrong)).toBe(false);
  });
});
