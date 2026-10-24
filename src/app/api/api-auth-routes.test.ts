import { describe, expect, it } from "vitest";
import { POST as uploadPost } from "./image/upload/route";
import { POST as sessionFeedbackPost } from "./session-feedback/route";
import { POST as locationInvitePost } from "./location-invite/route";
import { GET as pdfGet } from "./pdf/route";
import { GET as mediaGet } from "./media/route";

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

  it("GET /api/media retorna 401 sem token", async () => {
    const response = await mediaGet(
      new Request("http://localhost/api/media?publicId=clinic/u1/reports/x&resourceType=raw")
    );
    expect(response.status).toBe(401);
  });
});
