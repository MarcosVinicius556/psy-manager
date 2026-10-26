import { describe, expect, it } from "vitest";
import { scoreGad7 } from "./gad7";

describe("scoreGad7", () => {
  it("soma corretamente e classifica faixas", () => {
    const minimal = scoreGad7({
      q1: "0",
      q2: "0",
      q3: "0",
      q4: "0",
      q5: "0",
      q6: "0",
      q7: "0",
    });
    expect(minimal).toEqual({ ok: true, pontuacao: 0, faixa: "Mínima" });

    const moderate = scoreGad7({
      q1: "2",
      q2: "2",
      q3: "2",
      q4: "1",
      q5: "1",
      q6: "1",
      q7: "1",
    });
    expect(moderate.ok && moderate.pontuacao).toBe(10);
    expect(moderate.ok && moderate.faixa).toBe("Moderada");
  });
});
