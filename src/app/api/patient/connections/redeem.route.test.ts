import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePatientSession: vi.fn(),
  redeemPatientLinkCodeAndConnect: vi.fn(),
  ensurePatientUserDoc: vi.fn(),
  appendLinkCodeAudit: vi.fn(),
  enforceLinkCodeRedeemRateLimit: vi.fn(),
}));

vi.mock("@/lib/server/patient-portal/auth", () => ({
  requirePatientSession: mocks.requirePatientSession,
}));

vi.mock("@/lib/server/patient-portal/connections", () => ({
  redeemPatientLinkCodeAndConnect: mocks.redeemPatientLinkCodeAndConnect,
}));

vi.mock("@/lib/server/patient-portal/account-utils", () => ({
  ensurePatientUserDoc: mocks.ensurePatientUserDoc,
}));

vi.mock("@/lib/server/patient-portal/link-codes", () => ({
  appendLinkCodeAudit: mocks.appendLinkCodeAudit,
}));

vi.mock("@/lib/server/patient-portal/redeem-rate-limit", () => ({
  enforceLinkCodeRedeemRateLimit: mocks.enforceLinkCodeRedeemRateLimit,
}));

import { POST } from "./redeem/route";

describe("POST /api/patient/connections/redeem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceLinkCodeRedeemRateLimit.mockResolvedValue(null);
    mocks.requirePatientSession.mockResolvedValue({
      db: {},
      uid: "u1",
      email: "unverified@test.com",
      profileComplete: true,
      account: { email: "unverified@test.com" },
    });
    mocks.redeemPatientLinkCodeAndConnect.mockResolvedValue({
      ownerUid: "psy",
      patientId: "pat-1",
      connectionId: "u1_psy_pat-1",
    });
  });

  it("allows code redemption without verified email", async () => {
    const res = await POST(
      new Request("http://localhost/api/patient/connections/redeem", {
        method: "POST",
        body: JSON.stringify({ code: "ABCD-1234" }),
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.redeemPatientLinkCodeAndConnect).toHaveBeenCalled();
  });
});
