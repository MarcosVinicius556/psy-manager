import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/patient-portal/account-utils", () => ({
  setPatientCustomClaims: vi.fn(),
  normalizeEmail: (e: string) => e,
}));

import { redeemPatientLinkCodeAndConnect } from "./connections";

function buildMockDb(codeStatus: string) {
  const codeRef = { path: "patientLinkCodes/hash" };
  const patientRef = { path: "patients/pat-1" };
  const connRef = { path: "patientConnections/u1_psy_pat-1" };
  const accountRef = { path: "patientAccounts/u1" };
  const memberRef = { path: "members/psy" };

  return {
    collection: (name: string) => ({
      doc: () => {
        if (name === "patientLinkCodes") return codeRef;
        if (name === "patients") return patientRef;
        if (name === "patientConnections") return connRef;
        if (name === "patientAccounts") return accountRef;
        if (name === "members") return memberRef;
        throw new Error(name);
      },
      where: () => ({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: async (ref: { path?: string }) => {
          if (!ref.path) return { docs: [] };
          if (ref.path.startsWith("patientLinkCodes")) {
            return {
              exists: true,
              data: () => ({
                status: codeStatus,
                expiresAtMillis: Date.now() + 60_000,
                ownerUid: "psy",
                patientId: "pat-1",
              }),
            };
          }
          if (ref.path.startsWith("patients")) {
            return { exists: true, data: () => ({ ownerUid: "psy", portalAtivo: true, nome: "Paciente" }) };
          }
          if (ref.path.startsWith("patientConnections")) {
            return { exists: false, data: () => ({}) };
          }
          if (ref.path.startsWith("members")) {
            return { exists: true, data: () => ({ nome: "Psi", email: "psi@test.com" }) };
          }
          return { exists: false, data: () => ({}) };
        },
        set: vi.fn(async () => undefined),
      };
      return fn(tx);
    },
  };
}

describe("redeemPatientLinkCodeAndConnect", () => {
  it("redeems a pending code", async () => {
    const db = buildMockDb("pendente");
    const result = await redeemPatientLinkCodeAndConnect({
      db: db as never,
      codeInput: "ABCD1234",
      patientUid: "u1",
      email: "p@test.com",
    });
    expect(result.patientId).toBe("pat-1");
  });

  it("rejects when code is already consumed", async () => {
    const db = buildMockDb("vinculado");
    await expect(
      redeemPatientLinkCodeAndConnect({
        db: db as never,
        codeInput: "ABCD1234",
        patientUid: "u1",
        email: "p@test.com",
      })
    ).rejects.toThrow("codigo_invalido");
  });
});
