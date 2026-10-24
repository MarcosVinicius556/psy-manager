import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENTS } from "./config";
import { hashLegalContent } from "./hash";
import { compareLegalVersions, documentsRequiringAcceptance, isLegalVersionOutdated } from "./versions";

describe("legal versions", () => {
  it("compara versões major.minor", () => {
    expect(compareLegalVersions("1.0", "2.0")).toBeLessThan(0);
    expect(compareLegalVersions("2.0", "2.0")).toBe(0);
    expect(compareLegalVersions("2.1", "2.0")).toBeGreaterThan(0);
  });

  it("detecta versão desatualizada ou ausente", () => {
    expect(isLegalVersionOutdated(undefined, "2.0")).toBe(true);
    expect(isLegalVersionOutdated("1.0", "2.0")).toBe(true);
    expect(isLegalVersionOutdated("2.0", "2.0")).toBe(false);
  });

  it("gera hash estável do conteúdo canônico", () => {
    const a = hashLegalContent(LEGAL_DOCUMENTS.termos.acceptanceSource);
    const b = hashLegalContent(LEGAL_DOCUMENTS.termos.acceptanceSource);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("lista documentos pendentes de aceite", () => {
    const pending = documentsRequiringAcceptance({ termos: "1.0", privacidade: "2.0", dpa: "1.0" }, { requireDpa: true });
    expect(pending).toEqual(["termos"]);
  });
});
