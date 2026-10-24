import { describe, expect, it } from "vitest";
import { applySectionsToClinicalRecord, BUILTIN_CLINICAL_TEMPLATES, hydrateSectionsFromClinical } from "./clinical-note-templates";
import { emptyClinical } from "./types";

describe("clinical note templates", () => {
  it("aplica seções ao registro clínico", () => {
    const template = BUILTIN_CLINICAL_TEMPLATES[0];
    const clinical = applySectionsToClinicalRecord(emptyClinical(), template, {
      evolucao: "Paciente relatou melhora.",
      pensamentos: "Reestruturação cognitiva.",
    });
    expect(clinical.clinicalEvolution).toBe("Paciente relatou melhora.");
    expect(clinical.aspectosCognitivos).toBe("Reestruturação cognitiva.");
    expect(clinical.approach).toBe("tcc");
  });

  it("hidrata seções a partir dos campos legados", () => {
    const template = BUILTIN_CLINICAL_TEMPLATES[0];
    const clinical = {
      ...emptyClinical(),
      clinicalEvolution: "Nota antiga",
    };
    const sections = hydrateSectionsFromClinical(clinical, template);
    expect(sections.evolucao).toBe("Nota antiga");
  });
});
