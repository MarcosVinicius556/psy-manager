import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/server/patient-portal/psychologist-access", () => ({
  requirePsychologistPortalClinicalActor: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/server/account-data-export", () => ({
  buildAccountExportZipBytes: vi.fn(async () => new Uint8Array([0x50, 0x4b, 0x03, 0x04])),
}));

import { requirePsychologistPortalClinicalActor } from "@/lib/server/patient-portal/psychologist-access";
import { getAdminDb } from "@/lib/firebase-admin";

describe("account data-export API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nega secretária e demais não-titulares", async () => {
    vi.mocked(requirePsychologistPortalClinicalActor).mockResolvedValue({
      error: new Response(JSON.stringify({ reason: "proibido" }), { status: 403 }),
    });

    const response = await GET(new Request("http://localhost/api/account/data-export"));
    expect(response.status).toBe(403);
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("retorna ZIP para o titular", async () => {
    vi.mocked(requirePsychologistPortalClinicalActor).mockResolvedValue({ ownerUid: "owner-1" });
    vi.mocked(getAdminDb).mockReturnValue({} as never);

    const response = await GET(new Request("http://localhost/api/account/data-export"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(body[0]).toBe(0x50);
  });
});
