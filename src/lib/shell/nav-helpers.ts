import {
  isAdminNavGroup,
  isAdminNavLinkChild,
  type AdminNavEntry,
  type AdminNavGroup,
  type AdminNavGroupChild,
  type AdminNavLink,
} from "@/lib/admin/admin-nav";

export function navIsCurrent(rootHref: string, href: string, pathname: string) {
  return href === rootHref ? pathname === rootHref : pathname.startsWith(href);
}

export function navGroupForPath(
  menu: AdminNavEntry[],
  pathname: string,
  isCurrent: (href: string, pathname: string) => boolean
) {
  const match = menu.find(
    (entry) =>
      isAdminNavGroup(entry) &&
      entry.children.some((child) => isAdminNavLinkChild(child) && isCurrent(child.href, pathname))
  );
  return match && isAdminNavGroup(match) ? match.label : null;
}

export function visibleMenuGroupChildrenForTabBar(tabBarHrefs: ReadonlySet<string>, group: AdminNavGroup) {
  return group.children.filter((child) => {
    if (!isAdminNavLinkChild(child)) return true;
    return !tabBarHrefs.has(child.href);
  });
}

export function menuSheetShowsLinkForTabBar(tabBarHrefs: ReadonlySet<string>, entry: AdminNavLink) {
  return !tabBarHrefs.has(entry.href);
}

export type ShellNavConfig = {
  groupForPath: (menu: AdminNavEntry[], pathname: string) => string | null;
  isNavCurrent: (href: string, pathname: string) => boolean;
  menuSheetShowsLink: (entry: AdminNavLink) => boolean;
  visibleMenuGroupChildren: (group: AdminNavGroup) => AdminNavGroupChild[];
  sheetTestId: string;
  sheetElementId: string;
};
