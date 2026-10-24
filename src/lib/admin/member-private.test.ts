import { describe, expect, it } from "vitest";
import { pickMemberPrivateFields, stripMemberPrivateFields } from "./member-private";

describe("member-private helpers", () => {
  it("remove campos sensíveis do payload de members", () => {
    const stripped = stripMemberPrivateFields({
      nome: "Ana",
      cpf: "39053344705",
      crpNumero: "1",
      valorBase: 100,
    });
    expect(stripped).toEqual({ nome: "Ana", valorBase: 100 });
  });

  it("extrai campos privados do membro", () => {
    const picked = pickMemberPrivateFields({
      id: "m1",
      uid: "u1",
      nome: "Ana",
      email: "a@example.com",
      telefone: "",
      foto: "",
      cpf: "39053344705",
      crpNumero: "9",
      crpRegiao: "06",
      enderecoLogradouro: "Rua A",
      enderecoCidade: "Cidade",
      enderecoUf: "SP",
      enderecoCep: "01001000",
      reciboSequencia: 0,
      valorBase: 0,
      valorSocial: 0,
      workHours: [],
      contratoModelo: "",
      ativo: true,
      createdAt: "",
    });
    expect(picked.cpf).toBe("39053344705");
    expect(picked.enderecoUf).toBe("SP");
  });
});
