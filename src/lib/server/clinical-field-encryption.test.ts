import { afterEach, describe, expect, it, vi } from "vitest";
import { clinicalFieldEncryptionConfigured, encryptClinicalRecord, decryptClinicalRecord } from "./clinical-field-encryption";
import { emptyClinical } from "@/lib/admin/types";

const mockDb = {
  collection: vi.fn(),
};

describe("clinical-field-encryption", () => {
  afterEach(() => {
    delete process.env.CLINICAL_FIELD_ENC_KEY;
    vi.restoreAllMocks();
  });

  it("degrada para texto plano sem chave mestra", async () => {
    expect(clinicalFieldEncryptionConfigured()).toBe(false);
    const clinical = { ...emptyClinical(), notes: "demo" };
    const result = await encryptClinicalRecord(mockDb as never, "uid-1", clinical);
    expect(result.enc).toBeNull();
    expect(result.clinical?.notes).toBe("demo");
  });

  it("cifra e decifra com chave mestra", async () => {
    process.env.CLINICAL_FIELD_ENC_KEY = "a".repeat(64);
    let wrappedKey = "";
    const keysRef = {
      get: vi.fn().mockImplementation(async () => ({
        exists: Boolean(wrappedKey),
        data: () => ({ wrappedKey }),
      })),
      set: vi.fn().mockImplementation(async (data: { wrappedKey: string }) => {
        wrappedKey = data.wrappedKey;
      }),
    };
    mockDb.collection.mockReturnValue({ doc: () => keysRef });

    const clinical = { ...emptyClinical(), restrictedNote: "sigilo" };
    const encrypted = await encryptClinicalRecord(mockDb as never, "uid-2", clinical);
    expect(encrypted.enc).toBeTruthy();
    expect(encrypted.clinical).toBeNull();

    const roundTrip = await decryptClinicalRecord(mockDb as never, "uid-2", { enc: encrypted.enc });
    expect(roundTrip.restrictedNote).toBe("sigilo");
  });
});
