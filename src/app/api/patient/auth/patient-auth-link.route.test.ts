import { describe, expect, it, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  loadPatientAccountLink: vi.fn(),
  linkPatientAccount: vi.fn(),
  ensurePatientAccountShell: vi.fn(),
  patientsGet: vi.fn(),
  patientsWhere: vi.fn(),
}));

vi.mock("@/lib/server/patient-portal/auth", () => ({
  loadPatientAccountLink: mocks.loadPatientAccountLink,
  linkPatientAccount: mocks.linkPatientAccount,
}));

vi.mock("@/lib/server/patient-portal/connections", () => ({
  ensurePatientAccountShell: mocks.ensurePatientAccountShell,
}));

vi.mock("@/lib/server/require-auth", () => ({
  requireAuthUser: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => ({
    collection: (name: string) => {
      if (name !== "patients") throw new Error("unexpected");
      return {
        where: () => ({
          limit: () => ({
            get: mocks.patientsWhere,
          }),
        }),
        doc: () => ({ get: mocks.patientsGet }),
      };
    },
  }),
}));

import { requireAuthUser } from "@/lib/server/require-auth";
import { POST } from "./link/route";

describe("POST /api/patient/auth/link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadPatientAccountLink.mockResolvedValue({ uid: "p1", ownerUid: "", patientId: "", email: "p@test.com" });
    mocks.patientsWhere.mockResolvedValue({
      docs: [{ id: "pat-1", data: () => ({ ownerUid: "psy-1", portalAtivo: true }) }],
    });
  });

  it("rejects unverified email/password tokens", async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      uid: "attacker",
      email: "victim@test.com",
      idToken: "tok",
      emailVerified: false,
      signInProvider: "password",
      emailTrustedForLinking: false,
    });
    const res = await POST(new Request("http://localhost/api/patient/auth/link", { method: "POST" }));
    expect(res.status).toBe(403);
    expect(mocks.linkPatientAccount).not.toHaveBeenCalled();
  });

  it("links verified email to matching patient", async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      uid: "p1",
      email: "p@test.com",
      idToken: "tok",
      emailVerified: true,
      signInProvider: "password",
      emailTrustedForLinking: true,
    });
    const res = await POST(new Request("http://localhost/api/patient/auth/link", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(mocks.linkPatientAccount).toHaveBeenCalledWith(
      expect.objectContaining({ emailTrustedForLinking: true, patientId: "pat-1" })
    );
  });
});
