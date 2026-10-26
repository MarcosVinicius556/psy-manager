import type { AdminNavEntry, AdminNavGroup, AdminNavLink } from "@/lib/admin/admin-nav";
import { isAdminNavGroup } from "@/lib/admin/admin-nav";
import type { WorkspaceContext } from "./types";

const CLINICAL_HREFS = [
  "/admin/operacional/prontuario",
  "/admin/operacional/formularios",
  "/admin/operacional/conformidade",
  "/admin/atendimentos",
  "/admin/sala",
];

const STAFF_BLOCKED_PREFIXES = [
  "/admin/operacional",
  "/admin/atendimentos",
  "/admin/sala",
  "/admin/pacotes",
  "/admin/equipe/supervisao",
];

export function isClinicalRoute(pathname: string) {
  return CLINICAL_HREFS.some((href) => pathname.startsWith(href));
}

export function filterAdminNav(menu: AdminNavEntry[], workspace: WorkspaceContext | null): AdminNavEntry[] {
  if (!workspace || workspace.kind === "owner") return menu;
  if (workspace.kind === "clinica_profissional") return menu;

  const hideHref = (href: string) => {
    if (workspace.kind === "secretaria") {
      if (href.startsWith("/admin/equipe")) return true;
      if (STAFF_BLOCKED_PREFIXES.some((prefix) => href.startsWith(prefix))) return true;
      if (href.startsWith("/admin/assinatura")) return true;
    }
    if (workspace.clinicRole === "admin") {
      if (CLINICAL_HREFS.some((item) => href.startsWith(item))) return true;
    }
    return false;
  };

  return menu
    .map((entry) => {
      if (!isAdminNavGroup(entry)) {
        const link = entry as AdminNavLink;
        return hideHref(link.href) ? null : link;
      }
      const group = entry as AdminNavGroup;
      const children = group.children.filter((child) => {
        if (!("href" in child)) return true;
        return !hideHref(child.href);
      });
      if (!children.length) return null;
      return { ...group, children };
    })
    .filter(Boolean) as AdminNavEntry[];
}
