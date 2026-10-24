import { describe, expect, it } from "vitest";
import { POST as uploadPost } from "./image/upload/route";
import { POST as sessionFeedbackPost } from "./session-feedback/route";
import { POST as locationInvitePost } from "./location-invite/route";
import { GET as pdfGet } from "./pdf/route";

describe("API routes exigem autenticação", () => {
  it("POST /api/image/upload retorna 401 sem token", async () => {
    const form = new FormData();
    const response = await uploadPost(
      new Request("http://localhost/api/image/upload?accept=foto&kind=avatar", { method: "POST", body: form })
    );
    expect(response.status).toBe(401);
  });

  it("POST /api/session-feedback retorna 401 sem token", async () => {
    const response = await sessionFeedbackPost(
      new Request("http://localhost/api/session-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: "x" }),
      })
    );
    expect(response.status).toBe(401);
  });

  it("POST /api/location-invite retorna 401 sem token", async () => {
    const response = await locationInvitePost(
      new Request("http://localhost/api/location-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: "x" }),
      })
    );
    expect(response.status).toBe(401);
  });

  it("GET /api/pdf retorna 401 sem token", async () => {
    const response = await pdfGet(
      new Request("http://localhost/api/pdf?url=https://res.cloudinary.com/demo/raw/upload/sample.pdf&name=test.pdf")
    );
    expect(response.status).toBe(401);
  });
});
