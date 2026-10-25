import { describe, expect, it } from "vitest";
import {
  buildPlatformMenu,
  platformGroupForPath,
  platformMenuSheetShowsLink,
  platformTitleForPath,
} from "./platform-nav";

describe("platform-nav", () => {
  it("groups gestão and operação routes", () => {
    const menu = buildPlatformMenu("super_admin");
    expect(platformGroupForPath(menu, "/plataforma/contas")).toBe("Gestão");
    expect(platformGroupForPath(menu, "/plataforma/notificacoes")).toBe("Operação");
    expect(platformGroupForPath(menu, "/plataforma")).toBeNull();
  });

  it("limits support role to suporte", () => {
    const menu = buildPlatformMenu("support");
    expect(menu).toHaveLength(1);
    expect(platformTitleForPath("/plataforma/suporte/abc")).toBe("Suporte");
  });

  it("hides tab-bar routes from sheet top-level links", () => {
    expect(platformMenuSheetShowsLink({ href: "/plataforma", label: "Indicadores", icon: () => null })).toBe(false);
    expect(platformMenuSheetShowsLink({ href: "/plataforma/auditoria", label: "Auditoria", icon: () => null })).toBe(true);
  });
});
