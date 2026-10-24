import { describe, expect, it, vi, beforeEach } from "vitest";
import { authorizeClinicMediaAccess, parseClinicAssetPath } from "@/lib/server/cloudinary-media-access";

vi.mock("@/lib/server/clinic-access", () => ({
  patientOwnedByUid: vi.fn(),
  appointmentOwnedByUid: vi.fn(),
  paymentOwnedByUid: vi.fn(),
}));

import { appointmentOwnedByUid, patientOwnedByUid, paymentOwnedByUid } from "@/lib/server/clinic-access";

describe("parseClinicAssetPath", () => {
  it("reconhece fotos de pacientes pela pasta do titular", () => {
    const parsed = parseClinicAssetPath("clinic/owner-a/patients/photos/foto-1");
    expect(parsed).toEqual({ kind: "clinic-owner", ownerUid: "owner-a" });
  });

  it("reconhece contrato assinado", () => {
    const parsed = parseClinicAssetPath("clinic/owner-a/patients/pat-1/contracts/doc");
    expect(parsed).toEqual({ kind: "patient-contract", ownerUid: "owner-a", patientId: "pat-1" });
  });

  it("reconhece anamnese da sessão", () => {
    const parsed = parseClinicAssetPath("clinic/owner-a/appointments/sess-1/anamnese/arquivo");
    expect(parsed).toEqual({ kind: "appointment-clinical", ownerUid: "owner-a", appointmentId: "sess-1" });
  });
});

describe("authorizeClinicMediaAccess", () => {
  beforeEach(() => {
    vi.mocked(patientOwnedByUid).mockReset();
    vi.mocked(appointmentOwnedByUid).mockReset();
    vi.mocked(paymentOwnedByUid).mockReset();
  });

  it("permite titular na pasta da clínica", async () => {
    await expect(authorizeClinicMediaAccess("clinic/owner-a/reports/rel-1", "owner-a")).resolves.toBe(true);
    await expect(authorizeClinicMediaAccess("clinic/owner-a/reports/rel-1", "other-b")).resolves.toBe(false);
  });

  it("exige posse do paciente em contratos", async () => {
    vi.mocked(patientOwnedByUid).mockResolvedValueOnce(true);
    await expect(
      authorizeClinicMediaAccess("clinic/owner-a/patients/pat-1/contracts/doc", "owner-a")
    ).resolves.toBe(true);
    expect(patientOwnedByUid).toHaveBeenCalledWith("pat-1", "owner-a");
  });

  it("exige titular da sessão em anamnese", async () => {
    vi.mocked(appointmentOwnedByUid).mockResolvedValueOnce(false);
    await expect(
      authorizeClinicMediaAccess("clinic/owner-a/appointments/sess-1/anamnese/x", "owner-a")
    ).resolves.toBe(false);
    expect(appointmentOwnedByUid).toHaveBeenCalledWith("sess-1", "owner-a");
  });

  it("nega caminhos desconhecidos", async () => {
    await expect(authorizeClinicMediaAccess("avatars/user-a/pic", "user-a")).resolves.toBe(false);
  });
});
