import { afterEach, describe, expect, it } from "vitest";
import { platformBillingPixProfile } from "./platform-pix";
import { pixProfileReady } from "../pix/keys";

const VALID_CPF = "52998224725";
const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("platformBillingPixProfile", () => {
  it("infere CPF na chave de billing e considera perfil configurado", () => {
    process.env.PSY_BILLING_PIX_KEY = VALID_CPF;
    delete process.env.PSY_BILLING_PIX_KEY_TYPE;
    const profile = platformBillingPixProfile();
    expect(profile.pixTipo).toBe("cpf");
    expect(profile.configured).toBe(true);
    expect(pixProfileReady(profile).ok).toBe(true);
  });

  it("honra PSY_BILLING_PIX_KEY_TYPE quando definido", () => {
    process.env.PSY_BILLING_PIX_KEY = VALID_CPF;
    process.env.PSY_BILLING_PIX_KEY_TYPE = "telefone";
    const profile = platformBillingPixProfile();
    expect(profile.pixTipo).toBe("telefone");
    expect(pixProfileReady(profile).ok).toBe(true);
  });
});
