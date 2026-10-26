import { describe, expect, it } from "vitest";
import { scorePhq9 } from "./phq9";

/** Gabarito oficial: soma das nove respostas 0–3. */
describe("scorePhq9", () => {
  it("soma corretamente e classifica faixas", () => {
    const minimal = scorePhq9({
      q1: "0",
      q2: "0",
      q3: "0",
      q4: "0",
      q5: "0",
      q6: "0",
      q7: "0",
      q8: "0",
      q9: "0",
    });
    expect(minimal).toEqual({ ok: true, pontuacao: 0, faixa: "Mínima" });

    const moderate = scorePhq9({
      q1: "2",
      q2: "2",
      q3: "1",
      q4: "1",
      q5: "1",
      q6: "1",
      q7: "1",
      q8: "1",
      q9: "1",
    });
    expect(moderate).toMatchObject({ ok: true, pontuacao: 11, faixa: "Moderada" });

    const severe = scorePhq9({
      q1: "3",
      q2: "3",
      q3: "3",
      q4: "3",
      q5: "3",
      q6: "3",
      q7: "3",
      q8: "3",
      q9: "3",
    });
    expect(severe).toEqual({ ok: true, pontuacao: 27, faixa: "Grave" });
  });

  it("rejeita resposta fora da escala", () => {
    const bad = scorePhq9({ q1: "4", q2: "0", q3: "0", q4: "0", q5: "0", q6: "0", q7: "0", q8: "0", q9: "0" });
    expect(bad.ok).toBe(false);
  });
});
