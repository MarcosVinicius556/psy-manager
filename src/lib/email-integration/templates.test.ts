import { describe, expect, it } from "vitest";
import { renderTemplateText } from "./templates";

describe("email template rendering", () => {
  it("replaces variables", () => {
    const out = renderTemplateText("Olá {{paciente_nome}}, valor {{valor}}", {
      paciente_nome: "Ana",
      valor: "R$ 100",
    });
    expect(out).toBe("Olá Ana, valor R$ 100");
  });

  it("clears unknown variables", () => {
    expect(renderTemplateText("{{paciente_nome}}", {})).toBe("");
  });
});
