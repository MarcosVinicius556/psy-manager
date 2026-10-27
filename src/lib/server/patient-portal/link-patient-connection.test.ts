import { describe, expect, it, vi } from "vitest";
import { linkPatientConnection } from "./connections";

function mockDb(patientEmail: string) {
  const makeDoc = (name: string) => ({
    get: async () => {
      if (name === "patients") {
        return {
          exists: true,
          data: () => ({ ownerUid: "psy", portalAtivo: true, email: patientEmail, nome: "A" }),
        };
      }
      if (name === "members") {
        return { exists: true, data: () => ({ nome: "Psi", email: "psi@test.com" }) };
      }
      if (name === "patientConnections") {
        return { exists: false, data: () => ({}) };
      }
      return { exists: false, data: () => ({}) };
    },
    set: vi.fn(async () => undefined),
  });
  return {
    collection: (name: string) => ({
      doc: () => makeDoc(name),
      where: () => ({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
    }),
  };
}

describe("linkPatientConnection email trust", () => {
  it("blocks email match when email is not trusted", async () => {
    const db = mockDb("victim@test.com");
    await expect(
      linkPatientConnection({
        db: db as never,
        patientUid: "u1",
        email: "victim@test.com",
        ownerUid: "psy",
        patientId: "pat-1",
        emailTrustedForLinking: false,
      })
    ).rejects.toThrow("email_nao_verificado");
  });

  it("allows skipEmailCheck for code redemption path", async () => {
    const db = mockDb("victim@test.com");
    await expect(
      linkPatientConnection({
        db: db as never,
        patientUid: "u1",
        email: "attacker@test.com",
        ownerUid: "psy",
        patientId: "pat-1",
        skipEmailCheck: true,
      })
    ).resolves.toMatchObject({ connectionId: expect.any(String) });
  });
});
