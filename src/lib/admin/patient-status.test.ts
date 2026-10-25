import { describe, expect, it } from "vitest";
import { isPatientActive, normalizePatientStatus } from "./format";

describe("normalizePatientStatus", () => {
  it("treats missing status as ativo", () => {
    expect(normalizePatientStatus({})).toBe("ativo");
  });

  it("honors legacy ativo boolean when status is absent", () => {
    expect(normalizePatientStatus({ ativo: false })).toBe("inativo");
    expect(normalizePatientStatus({ ativo: true })).toBe("ativo");
  });

  it("normalizes english and mixed labels", () => {
    expect(normalizePatientStatus({ status: "inactive" })).toBe("inativo");
    expect(normalizePatientStatus({ status: "Ativo" })).toBe("ativo");
  });
});

describe("isPatientActive", () => {
  it("counts only ativo patients", () => {
    expect(isPatientActive({ status: "ativo" })).toBe(true);
    expect(isPatientActive({ status: "inativo" })).toBe(false);
  });
});
