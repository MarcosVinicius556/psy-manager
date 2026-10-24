import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/verify-id-token", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/verify-id-token")>();
  return {
    ...actual,
    verifyFirebaseIdToken: vi.fn(),
  };
});

import { bearerToken, verifyFirebaseIdToken } from "@/lib/server/verify-id-token";
import { requireAuthUser } from "@/lib/server/require-auth";

describe("bearerToken", () => {
  it("extrai token Bearer", () => {
    const request = new Request("http://localhost", {
      headers: { Authorization: "Bearer abc.def" },
    });
    expect(bearerToken(request)).toBe("abc.def");
  });

  it("retorna vazio sem header", () => {
    expect(bearerToken(new Request("http://localhost"))).toBe("");
  });
});

describe("requireAuthUser", () => {
  beforeEach(() => {
    vi.mocked(verifyFirebaseIdToken).mockReset();
  });

  it("rejeita sem Authorization", async () => {
    const result = await requireAuthUser(new Request("http://localhost"));
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("rejeita token inválido", async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue(null);
    const result = await requireAuthUser(
      new Request("http://localhost", { headers: { Authorization: "Bearer bad" } })
    );
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("aceita token válido", async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: "u1", email: "a@b.com" });
    const result = await requireAuthUser(
      new Request("http://localhost", { headers: { Authorization: "Bearer good" } })
    );
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.uid).toBe("u1");
      expect(result.email).toBe("a@b.com");
    }
  });
});
