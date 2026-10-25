import { describe, expect, it } from "vitest";
import { validateAttachmentMeta, validateAttachmentMime } from "./attachments";

describe("support attachments", () => {
  it("allows pdf", () => {
    expect(validateAttachmentMime("application/pdf")).toBe(true);
  });

  it("rejects exe", () => {
    expect(validateAttachmentMime("application/x-msdownload")).toBe(false);
  });

  it("validates size", () => {
    expect(validateAttachmentMeta({ mime: "image/png", size: 100 })).toBeNull();
    expect(validateAttachmentMeta({ mime: "image/png", size: 11 * 1024 * 1024 })).toMatch(/tamanho/);
  });
});
