import { describe, expect, it } from "vitest";
import { moneyInWords } from "./money-words";

describe("moneyInWords", () => {
  it("escreve valores inteiros", () => {
    expect(moneyInWords(1)).toBe("um real");
    expect(moneyInWords(2)).toBe("dois reais");
  });

  it("inclui centavos", () => {
    expect(moneyInWords(1.5)).toBe("um real e cinquenta centavos");
  });

  it("trata zero centavos", () => {
    expect(moneyInWords(150)).toBe("cento e cinquenta reais");
  });
});
