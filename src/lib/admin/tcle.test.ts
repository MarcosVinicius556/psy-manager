import { describe, expect, it } from "vitest";
import { fillTcleTemplate, tcleFieldValues } from "./tcle";
describe("tcle", () => {
  it("preenche placeholders do paciente e do CRP", () => {
    const patient = {
      id: "p1",
      nome: "Ana Silva",
      cpf: "52998224725",
      cpfPagador: "",
      cpfBeneficiario: "",
      nascimento: "",
      telefone: "",
      email: "",
      endereco: "",
      contatoEmergencia: "",
      observacoes: "",
      foto: "",
      contratoAssinado: null,
      tcleAceite: null,
      status: "ativo" as const,
      createdAt: "",
    };
    const values = tcleFieldValues({
      patient,
      professional: {
        nome: "Dra. Maria",
        email: "maria@example.com",
        telefone: "",
        crpNumero: "12345",
        crpRegiao: "06",
      },
      modalityLabel: "Presencial e online",
    });
    expect(values.NOME_PACIENTE).toBe("Ana Silva");
    expect(values.CRP).toContain("06");
    expect(values.CRP).toContain("12345");
    const filled = fillTcleTemplate("Paciente: {{NOME_PACIENTE}} · CRP {{CRP}}", values);
    expect(filled).toContain("Ana Silva");
    expect(filled).not.toContain("{{");
  });
});
