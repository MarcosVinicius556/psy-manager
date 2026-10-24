import { beforeEach, describe, expect, it, vi } from "vitest";
import { testFeedbackDocId, testFeedbackFirestoreId } from "@/lib/server/feedback-test-ids";

const getMock = vi.fn();
const runTransactionMock = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: () => ({
      doc: () => ({
        get: getMock,
      }),
    }),
    runTransaction: runTransactionMock,
  })),
}));

vi.mock("@/lib/server/public-feedback-rate-limit", () => ({
  enforcePublicFeedbackGetRateLimit: vi.fn(async () => null),
  enforcePublicFeedbackPostRateLimit: vi.fn(async () => null),
}));

import { GET } from "./[token]/route";

const TOKEN = testFeedbackDocId(1);
const FIRESTORE_ID = testFeedbackFirestoreId(20);

describe("GET /api/public/feedback/[token]", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("não retorna PII do paciente", async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({
        professionalNome: "Dra. Helena",
        sessionDate: "2026-10-24",
        startTime: "09:00",
        patientNome: "Ana Souza",
        patientId: "pat-ana",
        expiresAtMillis: Date.now() + 60_000,
        answeredAt: null,
        answeredAtMillis: null,
      }),
    });

    const response = await GET(new Request(`http://localhost/api/public/feedback/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      professionalNome: "Dra. Helena",
      sessionDate: "2026-10-24",
      startTime: "09:00",
      expired: false,
      answered: false,
    });
    expect(body.patientNome).toBeUndefined();
    expect(body.patientId).toBeUndefined();
    expect(body.email).toBeUndefined();
  });

  it("retorna 404 para token inválido", async () => {
    const response = await GET(new Request("http://localhost/api/public/feedback/bad-token"), {
      params: Promise.resolve({ token: "bad-token" }),
    });
    expect(response.status).toBe(404);
  });

  it("aceita id auto do Firestore", async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({
        professionalNome: "Dra. Helena",
        sessionDate: "2026-10-24",
        startTime: "09:00",
        expiresAtMillis: Date.now() + 60_000,
      }),
    });
    const response = await GET(new Request(`http://localhost/api/public/feedback/${FIRESTORE_ID}`), {
      params: Promise.resolve({ token: FIRESTORE_ID }),
    });
    expect(response.status).toBe(200);
  });
});
