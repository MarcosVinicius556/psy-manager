import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./insights/route";

vi.mock("@/lib/server/require-workspace", () => ({
  requireWorkspace: vi.fn(async () => ({
    auth: { uid: "secretary", email: "s@test.com", idToken: "t" },
    workspace: {
      kind: "secretaria",
      tenantOwnerUid: "owner-1",
      actorUid: "secretary",
      staffPerms: ["agenda", "pacientes", "financeiro"],
      clinicId: null,
      clinicRole: null,
      isClinicalAllowed: false,
    },
  })),
}));

vi.mock("@/lib/server/clinic-access", () => ({
  patientOwnedByUid: vi.fn(async () => true),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/server/patient-portal/data", () => ({
  psychologistInsights: vi.fn(),
}));

describe("patient-portal clinical API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("secretária recebe 403 ao buscar diário/escalas (insights)", async () => {
    const response = await GET(new Request("http://localhost/api/patient-portal/insights?patientId=p1"));
    expect(response.status).toBe(403);
  });
});
