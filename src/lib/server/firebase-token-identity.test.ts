import { describe, expect, it } from "vitest";
import { isVerifiedForEmailLinking } from "./firebase-token-identity";

describe("isVerifiedForEmailLinking", () => {
  const base = { uid: "u1", email: "p@test.com", emailVerified: false, signInProvider: "password" };

  it("rejects unverified password sign-in", () => {
    expect(isVerifiedForEmailLinking(base)).toBe(false);
  });

  it("accepts verified password sign-in", () => {
    expect(isVerifiedForEmailLinking({ ...base, emailVerified: true })).toBe(true);
  });

  it("accepts Google without relying on emailVerified flag", () => {
    expect(isVerifiedForEmailLinking({ ...base, signInProvider: "google.com" })).toBe(true);
  });

  it("accepts email link sign-in", () => {
    expect(isVerifiedForEmailLinking({ ...base, signInProvider: "emailLink" })).toBe(true);
  });
});
