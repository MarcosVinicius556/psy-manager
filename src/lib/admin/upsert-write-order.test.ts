import { describe, expect, it } from "vitest";
import { upsertPsychologistPhases } from "./upsert-write-order";

describe("upsertPsychologistPhases", () => {
  it("cria o usuário antes do membro para contas novas", () => {
    expect(upsertPsychologistPhases(false)).toEqual(["ensureUser", "ensureMember", "publishDirectory"]);
  });

  it("mantém membro e diretório depois do perfil existente", () => {
    expect(upsertPsychologistPhases(true)).toEqual(["ensureMember", "publishDirectory"]);
  });
});
