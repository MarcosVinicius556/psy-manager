import {
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineMail,
  HiOutlineUserGroup,
} from "react-icons/hi";
import {
  isAdminNavGroup,
  isAdminNavLinkChild,
  type AdminNavEntry,
  type AdminNavGroup,
  type AdminNavLink,
} from "@/lib/admin/admin-nav";
import {
  menuSheetShowsLinkForTabBar,
  navGroupForPath,
  navIsCurrent,
  visibleMenuGroupChildrenForTabBar,
  type ShellNavConfig,
} from "@/lib/shell/nav-helpers";

export const PLATFORM_ROOT = "/plataforma";

/** Primary mobile tab bar routes — remainder live in the menu sheet. */
export const PLATFORM_MOBILE_TAB_BAR_HREFS = new Set([
  "/plataforma",
  "/plataforma/contas",
  "/plataforma/suporte",
]);

const routeTitles: { prefix: string; title: string }[] = [
  { prefix: "/plataforma/contas", title: "Contas" },
  { prefix: "/plataforma/planos", title: "Planos" },
  { prefix: "/plataforma/suporte", title: "Suporte" },
  { prefix: "/plataforma/notificacoes", title: "Notificações" },
  { prefix: "/plataforma/auditoria", title: "Auditoria" },
];

const fullPlatformMenu: AdminNavEntry[] = [
  { href: "/plataforma", label: "Indicadores", icon: HiOutlineHome },
  {
    label: "Gestão",
    icon: HiOutlineUserGroup,
    children: [
      { href: "/plataforma/contas", label: "Contas", icon: HiOutlineUserGroup },
      { href: "/plataforma/planos", label: "Planos", icon: HiOutlineCreditCard },
    ],
  },
  {
    label: "Operação",
    icon: HiOutlineChatAlt2,
    children: [
      { href: "/plataforma/suporte", label: "Suporte", icon: HiOutlineChatAlt2 },
      { href: "/plataforma/notificacoes", label: "Notificações", icon: HiOutlineMail },
      { href: "/plataforma/auditoria", label: "Auditoria", icon: HiOutlineClipboardList },
    ],
  },
];

const supportOnlyMenu: AdminNavEntry[] = [
  { href: "/plataforma/suporte", label: "Suporte", icon: HiOutlineChatAlt2 },
];

export function buildPlatformMenu(role: string | null | undefined): AdminNavEntry[] {
  if (role === "support") return supportOnlyMenu;
  return fullPlatformMenu;
}

export function isPlatformNavCurrent(href: string, pathname: string) {
  return navIsCurrent(PLATFORM_ROOT, href, pathname);
}

export function platformTitleForPath(pathname: string) {
  if (pathname === "/plataforma") return "Indicadores";
  if (pathname.startsWith("/plataforma/contas/")) return "Conta";
  const match = routeTitles.find((item) => pathname.startsWith(item.prefix));
  return match?.title ?? "Plataforma";
}

export function platformGroupForPath(menu: AdminNavEntry[], pathname: string) {
  return navGroupForPath(menu, pathname, isPlatformNavCurrent);
}

export function visiblePlatformMenuGroupChildren(group: AdminNavGroup) {
  return visibleMenuGroupChildrenForTabBar(PLATFORM_MOBILE_TAB_BAR_HREFS, group);
}

export function platformMenuSheetShowsLink(entry: AdminNavLink) {
  return menuSheetShowsLinkForTabBar(PLATFORM_MOBILE_TAB_BAR_HREFS, entry);
}

export const platformShellNavConfig: ShellNavConfig = {
  groupForPath: platformGroupForPath,
  isNavCurrent: isPlatformNavCurrent,
  menuSheetShowsLink: platformMenuSheetShowsLink,
  visibleMenuGroupChildren: visiblePlatformMenuGroupChildren,
  sheetTestId: "platform-mobile-menu-sheet",
  sheetElementId: "platform-mobile-menu-sheet",
};

export function flattenPlatformLinks(menu: AdminNavEntry[]): AdminNavLink[] {
  const links: AdminNavLink[] = [];
  for (const entry of menu) {
    if (isAdminNavGroup(entry)) {
      for (const child of entry.children) {
        if (isAdminNavLinkChild(child)) links.push(child);
      }
    } else {
      links.push(entry);
    }
  }
  return links;
}
