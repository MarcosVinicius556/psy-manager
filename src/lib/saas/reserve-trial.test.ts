import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirebaseError } from "firebase/app";

const transactionGet = vi.fn();
const transactionSet = vi.fn();
const runTransaction = vi.fn();
const getDoc = vi.fn();

vi.mock("@/lib/admin/firebase", () => ({
  getFirebaseDb: () => ({}),
  getFirebaseAuth: () => ({}),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ path: "trialClaims/test@example.com" })),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: vi.fn(),
  runTransaction: (...args: unknown[]) => runTransaction(...args),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

describe("reserveTrial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runTransaction.mockImplementation(async (_db, handler) => {
      const tx = {
        get: transactionGet,
        set: transactionSet,
      };
      return handler(tx);
    });
  });

  it("cria a claim quando ainda não existe", async () => {
    transactionGet.mockResolvedValue({ exists: () => false });
    const { reserveTrial } = await import("./account-store");
    await expect(reserveTrial("test@example.com", "uid-1")).resolves.toBe(true);
    expect(transactionSet).toHaveBeenCalledTimes(1);
  });

  it("reaproveita a claim do mesmo uid", async () => {
    transactionGet.mockResolvedValue({ exists: () => true, data: () => ({ uid: "uid-1" }) });
    const { reserveTrial } = await import("./account-store");
    await expect(reserveTrial("test@example.com", "uid-1")).resolves.toBe(true);
    expect(transactionSet).not.toHaveBeenCalled();
  });

  it("relê a claim após permission-denied na transação", async () => {
    runTransaction.mockRejectedValue(new FirebaseError("permission-denied", "denied"));
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ uid: "uid-2" }) });
    const { reserveTrial } = await import("./account-store");
    await expect(reserveTrial("test@example.com", "uid-2")).resolves.toBe(true);
    expect(getDoc).toHaveBeenCalled();
  });
});
