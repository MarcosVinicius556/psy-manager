import { describe, expect, it } from "vitest";
import { adminGroupForPath, buildAdminMenu, menuSheetShowsLink } from "./admin-nav";

describe("admin-nav", () => {
  it("builds menu with super-admin extras before settings", () => {
    const menu = buildAdminMenu("super_admin");
    const labels = menu.filter((entry) => "href" in entry).map((entry) => entry.label);
    expect(labels).toContain("Usuários");
    expect(labels.at(-1)).toBe("Configurações");
  });

  it("resolves group for finance routes", () => {
    const menu = buildAdminMenu("psicologo");
    expect(adminGroupForPath(menu, "/admin/financeiro")).toBe("Financeiro");
    expect(adminGroupForPath(menu, "/admin/despesas")).toBe("Financeiro");
    expect(adminGroupForPath(menu, "/admin")).toBeNull();
  });

  it("hides tab-bar routes from sheet top-level links", () => {
    expect(menuSheetShowsLink({ href: "/admin", label: "Início", icon: () => null })).toBe(false);
    expect(menuSheetShowsLink({ href: "/admin/assinatura", label: "Assinatura", icon: () => null })).toBe(true);
  });
});
