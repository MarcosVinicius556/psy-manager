import type { ComponentType } from "react";
import {
  HiOutlineBell,
  HiOutlineBriefcase,
  HiOutlineChatAlt2,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineUserAdd,
  HiOutlineUsers,
} from "react-icons/hi";
import { HiOutlineBuildingOffice } from "react-icons/hi2";
import { LEGAL_FOOTER_LINKS } from "@/lib/legal/config";
import {
  menuSheetShowsLinkForTabBar,
  navGroupForPath,
  navIsCurrent,
  visibleMenuGroupChildrenForTabBar,
  type ShellNavConfig,
} from "@/lib/shell/nav-helpers";

export type AdminNavIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

export type AdminNavLink = {
  href: string;
  label: string;
  icon: AdminNavIcon;
};

export type AdminNavAction = {
  label: string;
  icon: AdminNavIcon;
  action: "cookie-preferences";
};

export type AdminNavGroupChild = AdminNavLink | AdminNavAction;

export type AdminNavGroup = {
  label: string;
  icon: AdminNavIcon;
  children: AdminNavGroupChild[];
};

export type AdminNavEntry = AdminNavLink | AdminNavGroup;

/** Routes duplicated on the mobile tab bar — hidden inside the menu sheet. */
export const MOBILE_TAB_BAR_HREFS = new Set(["/admin", "/admin/agenda", "/admin/pacientes"]);

export function isAdminNavGroup(entry: AdminNavEntry): entry is AdminNavGroup {
  return "children" in entry;
}

export function isAdminNavLinkChild(child: AdminNavGroupChild): child is AdminNavLink {
  return "href" in child;
}

export function isAdminNavCurrent(href: string, pathname: string) {
  return navIsCurrent("/admin", href, pathname);
}

function buildLegalNavGroup(): AdminNavGroup {
  return {
    label: "Legal",
    icon: HiOutlineShieldCheck,
    children: [
      ...LEGAL_FOOTER_LINKS.map((link) => ({
        href: link.href,
        label: link.label,
        icon: HiOutlineDocumentText,
      })),
      { label: "Preferências de cookies", icon: HiOutlineCog, action: "cookie-preferences" },
    ],
  };
}

const baseAdminNav: AdminNavEntry[] = [
  { href: "/admin", label: "Início", icon: HiOutlineHome },
  {
    label: "Clínica",
    icon: HiOutlineBuildingOffice,
    children: [
      { href: "/admin/agenda", label: "Agenda", icon: HiOutlineCalendar },
      { href: "/admin/pacientes", label: "Pacientes", icon: HiOutlineUsers },
      { href: "/admin/locais", label: "Locais", icon: HiOutlineOfficeBuilding },
      { href: "/admin/pacotes", label: "Pacotes", icon: HiOutlineClipboardList },
    ],
  },
  {
    label: "Financeiro",
    icon: HiOutlineCash,
    children: [
      { href: "/admin/financeiro", label: "Contas a receber", icon: HiOutlineCash },
      { href: "/admin/despesas", label: "Contas a pagar", icon: HiOutlineCurrencyDollar },
    ],
  },
  {
    label: "Operacional",
    icon: HiOutlineBriefcase,
    children: [
      { href: "/admin/operacional/contrato", label: "Modelo de contrato", icon: HiOutlineDocumentText },
      { href: "/admin/operacional/email", label: "Modelos de e-mail", icon: HiOutlineDocumentText },
      { href: "/admin/operacional/prontuario", label: "Modelos de prontuário", icon: HiOutlineDocumentText },
      { href: "/admin/operacional/consentimento", label: "Termo de consentimento", icon: HiOutlineShieldCheck },
      { href: "/admin/operacional/relatorios", label: "Gerador de relatórios", icon: HiOutlineChartBar },
      { href: "/admin/suporte", label: "Suporte", icon: HiOutlineChatAlt2 },
    ],
  },
  buildLegalNavGroup(),
  { href: "/admin/assinatura", label: "Assinatura", icon: HiOutlineCreditCard },
  { href: "/admin/notificacoes", label: "Notificações", icon: HiOutlineBell },
  { href: "/admin/configuracoes", label: "Configurações", icon: HiOutlineCog },
];

export function buildAdminMenu(role: string | null | undefined): AdminNavEntry[] {
  const tail = baseAdminNav[baseAdminNav.length - 1];
  const head = baseAdminNav.slice(0, -1);
  const extras: AdminNavLink[] =
    role === "super_admin"
      ? [
          { href: "/admin/usuarios", label: "Usuários", icon: HiOutlineUserAdd },
          { href: "/plataforma", label: "Plataforma", icon: HiOutlineShieldCheck },
        ]
      : [];
  return [...head, ...extras, tail];
}

const routeTitles: { prefix: string; title: string }[] = [
  { prefix: "/admin/agenda", title: "Agenda" },
  { prefix: "/admin/pacientes", title: "Pacientes" },
  { prefix: "/admin/financeiro", title: "Financeiro" },
  { prefix: "/admin/despesas", title: "Contas a pagar" },
  { prefix: "/admin/configuracoes", title: "Configurações" },
  { prefix: "/admin/notificacoes", title: "Notificações" },
  { prefix: "/admin/assinatura", title: "Assinatura" },
  { prefix: "/admin/locais", title: "Locais" },
  { prefix: "/admin/pacotes", title: "Pacotes" },
  { prefix: "/admin/usuarios", title: "Usuários" },
  { prefix: "/admin/operacional", title: "Operacional" },
  { prefix: "/admin/suporte", title: "Suporte" },
  { prefix: "/admin/atendimentos", title: "Atendimento" },
  { prefix: "/admin/sala", title: "Sala" },
];

export function adminTitleForPath(pathname: string) {
  if (pathname === "/admin") return "Início";
  const match = routeTitles.find((item) => pathname.startsWith(item.prefix));
  return match?.title ?? "Painel";
}

export function adminGroupForPath(menu: AdminNavEntry[], pathname: string) {
  return navGroupForPath(menu, pathname, isAdminNavCurrent);
}

export function visibleMenuGroupChildren(group: AdminNavGroup) {
  return visibleMenuGroupChildrenForTabBar(MOBILE_TAB_BAR_HREFS, group);
}

export function menuSheetShowsLink(entry: AdminNavLink) {
  return menuSheetShowsLinkForTabBar(MOBILE_TAB_BAR_HREFS, entry);
}

export const adminShellNavConfig: ShellNavConfig = {
  groupForPath: adminGroupForPath,
  isNavCurrent: isAdminNavCurrent,
  menuSheetShowsLink,
  visibleMenuGroupChildren,
  sheetTestId: "admin-mobile-menu-sheet",
  sheetElementId: "admin-mobile-menu-sheet",
};
