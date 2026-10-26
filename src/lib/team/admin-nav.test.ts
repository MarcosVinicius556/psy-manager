import { describe, expect, it } from "vitest";
import { buildAdminMenu } from "@/lib/admin/admin-nav";
import { filterAdminNav } from "./admin-nav";
import type { WorkspaceContext } from "./types";

describe("filterAdminNav", () => {
  it("hides equipe group links for secretaria", () => {
    const menu = buildAdminMenu("psicologo");
    const workspace: WorkspaceContext = {
      kind: "secretaria",
      tenantOwnerUid: "owner-1",
      actorUid: "staff-1",
      staffPerms: ["agenda", "financeiro"],
      clinicId: null,
      clinicRole: null,
      isClinicalAllowed: false,
    };
    const filtered = filterAdminNav(menu, workspace);
    const equipe = filtered.find((entry) => "children" in entry && entry.label === "Equipe");
    expect(equipe).toBeUndefined();
  });

  it("hides clinical operacional links for clinic admin", () => {
    const menu = buildAdminMenu("psicologo");
    const workspace: WorkspaceContext = {
      kind: "clinica_admin",
      tenantOwnerUid: "admin-1",
      actorUid: "admin-1",
      staffPerms: [],
      clinicId: "clinic-1",
      clinicRole: "admin",
      isClinicalAllowed: false,
    };
    const filtered = filterAdminNav(menu, workspace);
    const operacional = filtered.find((entry) => "children" in entry && entry.label === "Operacional");
    const hrefs =
      operacional && "children" in operacional
        ? operacional.children.filter((child) => "href" in child).map((child) => child.href)
        : [];
    expect(hrefs.some((href) => href.includes("prontuario"))).toBe(false);
  });
});
