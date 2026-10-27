import { describe, expect, it } from "vitest";
import { inferPixKeyType } from "./keys";

describe("inferPixKeyType", () => {
  it("trata 11 dígitos com verificadores de CPF válidos como CPF", () => {
    expect(inferPixKeyType("52998224725")).toBe("cpf");
  });

  it("trata 11 dígitos sem CPF válido como telefone", () => {
    expect(inferPixKeyType("11999998888")).toBe("telefone");
  });
});
