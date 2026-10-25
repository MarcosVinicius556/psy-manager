import { describe, expect, it } from "vitest";
import { assertTransition, canTransition } from "./transitions";

describe("support ticket transitions", () => {
  it("allows aberto to em_analise", () => {
    expect(canTransition("aberto", "em_analise")).toBe(true);
  });

  it("rejects aberto to resolvido", () => {
    expect(canTransition("aberto", "resolvido")).toBe(false);
  });

  it("requires github merge for aguardando_aprovacao to resolvido", () => {
    expect(assertTransition("aguardando_aprovacao", "resolvido", {}).ok).toBe(false);
    expect(assertTransition("aguardando_aprovacao", "resolvido", { githubMerged: true }).ok).toBe(true);
  });

  it("allows reprovado to em_desenvolvimento", () => {
    expect(canTransition("reprovado", "em_desenvolvimento")).toBe(true);
  });

  it("allows encerrado to reaberto", () => {
    expect(canTransition("encerrado", "reaberto")).toBe(true);
  });
});
