import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/patient-portal/account-utils", () => ({
  setPatientCustomClaims: vi.fn(),
  normalizeEmail: (e: string) => e.trim().toLowerCase(),
}));

import { acceptPortalInviteAndConnect } from "./connections";

function buildInviteDb(inviteState: { exists: boolean; used?: boolean; expired?: boolean }) {
  const inviteRef = { path: "portalInvites/tok" };
  let used = inviteState.used === true;
  const expiresAtMillis = inviteState.expired ? Date.now() - 1000 : Date.now() + 60_000;

  return {
    collection: (name: string) => ({
      doc: (id: string) => {
        if (name === "portalInvites") return inviteRef;
        if (name === "patients") return { path: `patients/${id}` };
        if (name === "members") return { path: `members/${id}` };
        if (name === "patientConnections") return { path: `patientConnections/${id}` };
        if (name === "patientAccounts") return { path: `patientAccounts/${id}` };
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
          if (ref.path.startsWith("portalInvites")) {
            if (!inviteState.exists) return { exists: false, data: () => ({}) };
            return {
              exists: true,
              data: () => ({
                ownerUid: "psy",
                patientId: "pat-1",
                expiresAtMillis,
                usedAtMillis: used ? Date.now() - 5000 : null,
              }),
            };
          }
          if (ref.path.startsWith("patients")) {
            return { exists: true, data: () => ({ ownerUid: "psy", portalAtivo: true, nome: "Paciente" }) };
          }
          if (ref.path.startsWith("members")) {
            return { exists: true, data: () => ({ nome: "Psi", email: "psi@test.com" }) };
          }
          if (ref.path.startsWith("patientConnections")) {
            return { exists: false, data: () => ({}) };
          }
          return { exists: false, data: () => ({}) };
        },
        set: vi.fn(async (ref: { path?: string }, data: Record<string, unknown>) => {
          if (ref.path?.startsWith("portalInvites") && data.usedAtMillis) {
            if (used) throw new Error("convite_usado");
            used = true;
          }
        }),
      };
      return fn(tx);
    },
  };
}

describe("acceptPortalInviteAndConnect", () => {
  it("links unverified user when invite is valid", async () => {
    const db = buildInviteDb({ exists: true });
    const result = await acceptPortalInviteAndConnect({
      db: db as never,
      inviteToken: "tok",
      patientUid: "u1",
      email: "unverified@test.com",
    });
    expect(result.patientId).toBe("pat-1");
  });

  it("rejects expired invite", async () => {
    const db = buildInviteDb({ exists: true, expired: true });
    await expect(
      acceptPortalInviteAndConnect({
        db: db as never,
        inviteToken: "tok",
        patientUid: "u1",
        email: "p@test.com",
      })
    ).rejects.toThrow("convite_expirado");
  });

  it("rejects used invite", async () => {
    const db = buildInviteDb({ exists: true, used: true });
    await expect(
      acceptPortalInviteAndConnect({
        db: db as never,
        inviteToken: "tok",
        patientUid: "u1",
        email: "p@test.com",
      })
    ).rejects.toThrow("convite_usado");
  });

  it("rejects unknown invite", async () => {
    const db = buildInviteDb({ exists: false });
    await expect(
      acceptPortalInviteAndConnect({
        db: db as never,
        inviteToken: "tok",
        patientUid: "u1",
        email: "p@test.com",
      })
    ).rejects.toThrow("convite_invalido");
  });

  it("fails on second acceptance", async () => {
    const db = buildInviteDb({ exists: true });
    await acceptPortalInviteAndConnect({
      db: db as never,
      inviteToken: "tok",
      patientUid: "u1",
      email: "p@test.com",
    });
    await expect(
      acceptPortalInviteAndConnect({
        db: db as never,
        inviteToken: "tok",
        patientUid: "u2",
        email: "other@test.com",
      })
    ).rejects.toThrow("convite_usado");
  });
});
