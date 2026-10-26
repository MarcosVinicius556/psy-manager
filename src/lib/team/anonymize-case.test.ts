import { describe, expect, it } from "vitest";
import { emptyClinical } from "@/lib/admin/types";
import { buildAnonymizedCase } from "./anonymize-case";

describe("buildAnonymizedCase", () => {
  it("remove nome e CPF do texto", () => {
    const patient = {
      id: "p1",
      nome: "Ana Demonstração",
      cpf: "39053344705",
      cpfPagador: "",
      cpfBeneficiario: "",
      nascimento: "",
      telefone: "11999990000",
      email: "ana@demo.test",
      endereco: "Rua Fictícia",
      contatoEmergencia: "",
      observacoes: "",
      foto: "",
      contratoAssinado: null,
      tcleAceite: null,
      status: "ativo" as const,
      createdAt: "",
    };
    const payload = buildAnonymizedCase({
      patient,
      titulo: "Supervisão da Ana Demonstração",
      sessions: [
        {
          date: "2026-01-10",
          clinical: {
            ...emptyClinical(),
            clinicalEvolution: "Ana Demonstração relatou ansiedade. CPF 390.533.447-05.",
          },
        },
      ],
    });
    expect(payload.titulo.toLowerCase()).not.toContain("ana demonstração");
    expect(payload.linhaDoTempo[0].texto).not.toMatch(/390\.533\.447-05|39053344705/i);
    expect(payload.linhaDoTempo[0].relativo).toBe("D+0");
  });
});
