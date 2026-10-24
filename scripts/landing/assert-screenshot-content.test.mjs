import { describe, expect, it } from "vitest";
import { FORBIDDEN_SCREENSHOT_PHRASES } from "./assert-screenshot-content.mjs";

describe("landing screenshot guards", () => {
  it("lists empty-state phrases that must not appear in captures", () => {
    expect(FORBIDDEN_SCREENSHOT_PHRASES).toEqual(
      expect.arrayContaining(["Cadastre o básico", "Paciente não encontrado", "Nenhum paciente cadastrado"])
    );
    for (const phrase of FORBIDDEN_SCREENSHOT_PHRASES) {
      expect(phrase.length).toBeGreaterThan(4);
    }
  });
});
