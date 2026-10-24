import { describe, expect, it } from "vitest";
import { parseUploadKind, parseUploadAccept } from "@/lib/server/upload-policy";

describe("upload-policy", () => {
  it("aceita kinds conhecidos", () => {
    expect(parseUploadKind("avatar")).toBe("avatar");
    expect(parseUploadKind("patient-contract")).toBe("patient-contract");
    expect(parseUploadKind("evil")).toBeNull();
  });

  it("interpreta accept", () => {
    expect(parseUploadAccept(new URLSearchParams("accept=documento"))).toBe("documento");
    expect(parseUploadAccept(new URLSearchParams("accept=foto"))).toBe("foto");
    expect(parseUploadAccept(new URLSearchParams())).toBe("imagem");
  });
});
