import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  acceptPortalInviteAndConnect: vi.fn(),
  ensurePatientUserDoc: vi.fn(),
  requireAuthUser: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/server/patient-portal/connections", () => ({
  acceptPortalInviteAndConnect: mocks.acceptPortalInviteAndConnect,
}));

vi.mock("@/lib/server/patient-portal/account-utils", () => ({
  ensurePatientUserDoc: mocks.ensurePatientUserDoc,
}));

vi.mock("@/lib/server/require-auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: mocks.getAdminDb,
}));

import { POST } from "./route";

const VALID_TOKEN = "11111111-1111-4111-8111-111111111111";

describe("POST /api/public/patient-invite/[token]/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminDb.mockReturnValue({});
    mocks.requireAuthUser.mockResolvedValue({
      uid: "u1",
      email: "unverified@test.com",
      idToken: "tok",
      emailVerified: false,
      signInProvider: "password",
      emailTrustedForLinking: false,
    });
    mocks.acceptPortalInviteAndConnect.mockResolvedValue({ connectionId: "c1" });
  });

  it("accepts valid invite for unverified email/password user", async () => {
    const res = await POST(
      new Request("http://localhost/api/public/patient-invite/x/accept", { method: "POST" }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );
    expect(res.status).toBe(200);
    expect(mocks.acceptPortalInviteAndConnect).toHaveBeenCalledWith(
      expect.objectContaining({ patientUid: "u1", inviteToken: VALID_TOKEN })
    );
  });

  it("maps expired invite to 410", async () => {
    mocks.acceptPortalInviteAndConnect.mockRejectedValue(new Error("convite_expirado"));
    const res = await POST(
      new Request("http://localhost/api/public/patient-invite/x/accept", { method: "POST" }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );
    expect(res.status).toBe(410);
  });

  it("maps used invite to 410", async () => {
    mocks.acceptPortalInviteAndConnect.mockRejectedValue(new Error("convite_usado"));
    const res = await POST(
      new Request("http://localhost/api/public/patient-invite/x/accept", { method: "POST" }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );
    expect(res.status).toBe(410);
  });

  it("maps unknown invite to 404", async () => {
    mocks.acceptPortalInviteAndConnect.mockRejectedValue(new Error("convite_invalido"));
    const res = await POST(
      new Request("http://localhost/api/public/patient-invite/x/accept", { method: "POST" }),
      { params: Promise.resolve({ token: VALID_TOKEN }) }
    );
    expect(res.status).toBe(404);
  });

  it("rejects invalid token format", async () => {
    const res = await POST(
      new Request("http://localhost/api/public/patient-invite/x/accept", { method: "POST" }),
      { params: Promise.resolve({ token: "not-a-uuid" }) }
    );
    expect(res.status).toBe(400);
    expect(mocks.acceptPortalInviteAndConnect).not.toHaveBeenCalled();
  });
});
