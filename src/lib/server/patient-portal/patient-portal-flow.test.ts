import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashLinkCode } from "./link-codes";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    setCustomUserClaims: vi.fn(),
  }),
}));

describe("patient portal link code security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses stable hash for lookup", () => {
    const hash = hashLinkCode("WXYZ-5678");
    expect(hash).toHaveLength(64);
  });
});
