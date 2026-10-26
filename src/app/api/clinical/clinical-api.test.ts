import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../clinical/[appointmentId]/route";

vi.mock("@/lib/server/require-auth", () => ({
  requireAuthUser: vi.fn(async () => ({ uid: "secretary-uid", email: "sec@test.com", idToken: "token" })),
}));

vi.mock("@/lib/server/clinic-access", () => ({
  appointmentOwnedByUid: vi.fn(async () => false),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ patientId: "p1", ownerUid: "owner-1" }) }),
      }),
    }),
  })),
}));

vi.mock("@/lib/server/clinical-field-encryption", () => ({
  clinicalFieldEncryptionConfigured: () => false,
  decryptClinicalRecord: async () => ({}),
}));

vi.mock("@/lib/server/clinical-access-log", () => ({
  recordClinicalAccess: vi.fn(),
}));

describe("clinical API secretary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 para usuário que não é titular do atendimento", async () => {
    const response = await GET(new Request("http://localhost/api/clinical/appt-1"), {
      params: Promise.resolve({ appointmentId: "appt-1" }),
    });
    expect(response.status).toBe(403);
  });
});
