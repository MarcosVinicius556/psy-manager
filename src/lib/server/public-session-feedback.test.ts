import { describe, expect, it } from "vitest";
import {
  testFeedbackFirestoreId,
  testFeedbackUuidV4Zero,
} from "./feedback-test-ids";
import {
  feedbackAnswered,
  feedbackExpired,
  isValidFeedbackToken,
  parseFeedbackRating,
  publicFeedbackHasPatientPii,
  sanitizeFeedbackComment,
  toPublicFeedbackView,
} from "./public-session-feedback";

describe("public session feedback validation", () => {
  it("aceita token UUID v4", () => {
    expect(isValidFeedbackToken(testFeedbackUuidV4Zero())).toBe(true);
    expect(isValidFeedbackToken("not-a-token")).toBe(false);
  });

  it("aceita id auto do Firestore (20 caracteres)", () => {
    expect(isValidFeedbackToken(testFeedbackFirestoreId(20))).toBe(true);
    expect(isValidFeedbackToken("short-id")).toBe(false);
    expect(isValidFeedbackToken(testFeedbackFirestoreId(21))).toBe(false);
  });

  it("valida estrelas 1-5", () => {
    expect(parseFeedbackRating(3)).toBe(3);
    expect(parseFeedbackRating("4")).toBe(4);
    expect(parseFeedbackRating(0)).toBeNull();
    expect(parseFeedbackRating(6)).toBeNull();
    expect(parseFeedbackRating("x")).toBeNull();
  });

  it("sanitiza comentário e limita tamanho", () => {
    const long = "a".repeat(1200);
    expect(sanitizeFeedbackComment(`  ok \u0007 ${long}  `).length).toBe(1000);
    expect(sanitizeFeedbackComment("  texto limpo  ")).toBe("texto limpo");
  });

  it("detecta expirado e respondido", () => {
    const future = Date.now() + 60_000;
    const past = Date.now() - 60_000;
    expect(feedbackExpired({ expiresAtMillis: future })).toBe(false);
    expect(feedbackExpired({ expiresAtMillis: past })).toBe(true);
    expect(feedbackAnswered({ answeredAtMillis: Date.now() })).toBe(true);
    expect(feedbackAnswered({ answeredAt: "2026-01-01T00:00:00.000Z" })).toBe(true);
  });

  it("expõe apenas campos públicos", () => {
    const view = toPublicFeedbackView({
      professionalNome: "Dra. Ana",
      sessionDate: "2026-10-24",
      startTime: "10:00",
      patientNome: "Segredo",
      patientId: "pat-1",
      expiresAtMillis: Date.now() + 60_000,
    });
    expect(view).toEqual({
      professionalNome: "Dra. Ana",
      sessionDate: "2026-10-24",
      startTime: "10:00",
      expired: false,
      answered: false,
    });
    expect(publicFeedbackHasPatientPii(view)).toBe(false);
  });
});
