import { describe, expect, it } from "vitest";
import { buildMimeMessage } from "./mime";

describe("MIME builder", () => {
  it("builds base64url raw message with UTF-8 subject", () => {
    const raw = buildMimeMessage({
      from: "prof@example.com",
      to: "paciente@example.com",
      subject: "Confirmação — sessão",
      html: "<p>Olá</p>",
      text: "Olá",
    });
    expect(raw).not.toContain("+");
    expect(raw).not.toContain("/");
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    expect(decoded).toContain("=?UTF-8?B?");
    expect(decoded).toContain("multipart/alternative");
  });
});
