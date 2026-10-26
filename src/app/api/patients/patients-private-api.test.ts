import { describe, expect, it, vi } from "vitest";
import { GET } from "./[id]/private/route";

vi.mock("@/lib/server/require-workspace", () => ({
  requireWorkspace: vi.fn(async () => ({
    auth: { uid: "secretary", email: "s@test.com", idToken: "t" },
    workspace: {
      kind: "secretaria",
      tenantOwnerUid: "owner-1",
      actorUid: "secretary",
      staffPerms: ["pacientes"],
      clinicId: null,
      clinicRole: null,
      isClinicalAllowed: false,
    },
  })),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({})),
}));

describe("patient private API", () => {
  it("secretária recebe 403 ao tentar ler campos privados", async () => {
    const response = await GET(new Request("http://localhost/api/patients/p1/private"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(response.status).toBe(403);
  });
});
