"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup } from "motion/react";
import { HiOutlineBell, HiOutlineBriefcase, HiOutlineCalendar, HiOutlineCash, HiOutlineChartBar, HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineClipboardList, HiOutlineCog, HiOutlineCreditCard, HiOutlineCurrencyDollar, HiOutlineDocumentText, HiOutlineHome, HiOutlineLogout, HiOutlineOfficeBuilding, HiOutlineShieldCheck, HiOutlineUserAdd, HiOutlineUsers, HiOutlineX } from "react-icons/hi";
import BrandLogo from "@/components/BrandLogo";
import { AdminPageMotion } from "@/components/admin/motion/AdminPageMotion";
import { SidebarActivePill } from "@/components/admin/motion/NavPill";
import MobileHeader from "@/components/admin/mobile/MobileHeader";
import MobileTabBar from "@/components/admin/mobile/MobileTabBar";
import { AdminPageMetaProvider, useAdminPageMeta } from "@/lib/admin/page-meta-context";
import Avatar from "./Avatar";
import { isExpenseAlert } from "@/lib/admin/expenses";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { HiOutlineBuildingOffice } from "react-icons/hi2";
import { LEGAL_FOOTER_LINKS } from "@/lib/legal/config";
import { useCookieConsent } from "@/components/legal/CookieConsentProvider";

type NavIcon = typeof HiOutlineHome;

type NavLinkItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

type NavActionItem = {
  label: string;
  icon: NavIcon;
  action: "cookie-preferences";
};

type NavGroupChild = NavLinkItem | NavActionItem;

type NavGroupItem = {
  label: string;
  icon: NavIcon;
  children: NavGroupChild[];
};

type NavEntry = NavLinkItem | NavGroupItem;

function isNavLinkChild(child: NavGroupChild): child is NavLinkItem {
  return "href" in child;
}

function buildLegalNavGroup(): NavGroupItem {
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

const items: NavEntry[] = [
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
      { href: "/admin/operacional/prontuario", label: "Modelos de prontuário", icon: HiOutlineDocumentText },
      { href: "/admin/operacional/consentimento", label: "Termo de consentimento", icon: HiOutlineShieldCheck },
      { href: "/admin/operacional/relatorios", label: "Gerador de relatórios", icon: HiOutlineChartBar },
    ],
  },
  buildLegalNavGroup(),
  { href: "/admin/assinatura", label: "Assinatura", icon: HiOutlineCreditCard },
  { href: "/admin/notificacoes", label: "Notificações", icon: HiOutlineBell },
  { href: "/admin/configuracoes", label: "Configurações", icon: HiOutlineCog },
];

function isGroup(entry: NavEntry): entry is NavGroupItem {
  return "children" in entry;
}

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
  { prefix: "/admin/atendimentos", title: "Atendimento" },
  { prefix: "/admin/sala", title: "Sala" },
];

function titleForPath(pathname: string) {
  if (pathname === "/admin") return "Início";
  const match = routeTitles.find((item) => pathname.startsWith(item.prefix));
  return match?.title ?? "Painel";
}

function groupForPath(menu: NavEntry[], pathname: string) {
  const match = menu.find(
    (entry) =>
      isGroup(entry) &&
      entry.children.some((child) => isNavLinkChild(child) && isCurrent(child.href, pathname))
  );
  return match && isGroup(match) ? match.label : null;
}

function navShellClass(collapsed: boolean, nested = false) {
  return `relative flex items-center overflow-hidden rounded-xl border border-transparent text-sm font-medium transition-[color,background-color] duration-200 ${
    collapsed ? "justify-center px-0 py-3" : nested ? "gap-3 py-2.5 pl-9 pr-3" : "gap-3 px-3 py-3"
  }`;
}

function navToneClass(current: boolean) {
  return current ? "text-teal" : "text-white/85 hover:bg-white/10 hover:text-white";
}

function FadeLabel({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-out ${
        show ? "max-w-[12rem] opacity-100" : "max-w-0 opacity-0"
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function NavAnchor({ item, collapsed, pathname, unread }: { item: NavLinkItem; collapsed: boolean; pathname: string; unread: number }) {
  const Icon = item.icon;
  const current = isCurrent(item.href, pathname);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`motion-press ${navShellClass(collapsed)} ${navToneClass(current)}`}
    >
      {current ? <SidebarActivePill /> : null}
      <span className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <span className="relative shrink-0">
          <Icon size={20} />
          {item.href === "/admin/notificacoes" && unread > 0 && (
            <span
              className={`absolute -right-1 -top-1 h-2 w-2 bg-accent transition-opacity duration-300 ${collapsed ? "opacity-100" : "opacity-0"}`}
              style={{ borderRadius: "50%" }}
            />
          )}
        </span>
        <FadeLabel show={!collapsed} className="flex-1">
          {item.label}
        </FadeLabel>
        <FadeLabel show={!collapsed && item.href === "/admin/notificacoes" && unread > 0}>
          <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-white">{unread}</span>
        </FadeLabel>
      </span>
    </Link>
  );
}

function NavGroup({
  item,
  collapsed,
  pathname,
  open,
  onToggle,
  onCookiePreferences,
}: {
  item: NavGroupItem;
  collapsed: boolean;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onCookiePreferences?: () => void;
}) {
  const groupActive = item.children.some((child) => isNavLinkChild(child) && isCurrent(child.href, pathname));
  const [box, setBox] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  const flyoutOpen = collapsed && open;

  useEffect(() => {
    setMounted(true);
  }, []);

  function placeFlyout() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.top, left: rect.right + 8 });
  }

  useEffect(() => {
    if (!collapsed) return;
    if (open) placeFlyout();
  }, [collapsed, open]);

  useEffect(() => {
    if (!flyoutOpen) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || flyoutRef.current?.contains(target)) return;
      onToggle();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && open) onToggle();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeFlyout);
    window.addEventListener("scroll", placeFlyout, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placeFlyout);
      window.removeEventListener("scroll", placeFlyout, true);
    };
  }, [flyoutOpen, open, onToggle]);

  const highlighted = collapsed ? groupActive : groupActive && !open;

  return (
    <div ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
        className={`motion-press w-full ${navShellClass(collapsed)} ${navToneClass(highlighted)}`}
        onClick={() => {
          if (collapsed) placeFlyout();
          onToggle();
        }}
      >
        {highlighted ? <SidebarActivePill /> : null}
        <Icon size={20} className="relative z-10 shrink-0" />
        <FadeLabel show={!collapsed} className="relative z-10 flex-1 text-left">
          {item.label}
        </FadeLabel>
        <HiOutlineChevronDown
          size={16}
          className={`relative z-10 shrink-0 transition-[transform,opacity,width] duration-300 ${
            collapsed ? "w-0 opacity-0" : "opacity-100"
          } ${open && !collapsed ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          !collapsed && open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 flex flex-col gap-1">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              if (!isNavLinkChild(child)) {
                return (
                  <button
                    key={child.label}
                    type="button"
                    className={`motion-press ${navShellClass(false, true)} ${navToneClass(false)}`}
                    onClick={() => onCookiePreferences?.()}
                  >
                    <ChildIcon size={18} className="relative z-10" />
                    <span className="relative z-10 flex-1 text-left">{child.label}</span>
                  </button>
                );
              }
              const childCurrent = isCurrent(child.href, pathname);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`motion-press ${navShellClass(false, true)} ${navToneClass(childCurrent)}`}
                >
                  {childCurrent ? <SidebarActivePill /> : null}
                  <ChildIcon size={18} className="relative z-10" />
                  <span className="relative z-10 flex-1">{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {mounted &&
        collapsed &&
        createPortal(
          <div
            ref={flyoutRef}
            className={`fixed z-50 w-56 rounded-md border border-white/20 bg-teal p-1 shadow-lg transition-[opacity,transform] duration-200 ease-out ${
              flyoutOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-1 opacity-0"
            }`}
            style={{ top: box.top, left: box.left }}
          >
            <p className="px-3 pb-1 pt-2 text-[0.68rem] uppercase tracking-[0.16em] text-leaf">{item.label}</p>
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              if (!isNavLinkChild(child)) {
                return (
                  <button
                    key={child.label}
                    type="button"
                    className={`motion-press ${navShellClass(false)} ${navToneClass(false)}`}
                    onClick={() => {
                      onToggle();
                      onCookiePreferences?.();
                    }}
                  >
                    <ChildIcon size={18} className="relative z-10" />
                    <span className="relative z-10 flex-1 text-left">{child.label}</span>
                  </button>
                );
              }
              const childCurrent = isCurrent(child.href, pathname);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`motion-press ${navShellClass(false)} ${navToneClass(childCurrent)}`}
                >
                  {childCurrent ? <SidebarActivePill /> : null}
                  <ChildIcon size={18} className="relative z-10" />
                  <span className="relative z-10 flex-1">{child.label}</span>
                </Link>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { meta, actionRef, setMeta } = useAdminPageMeta();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, role } = useAuth();
  const menu: NavEntry[] = [
    ...items.slice(0, -1),
    ...(role === "super_admin"
      ? [
          { href: "/admin/usuarios", label: "Usuários", icon: HiOutlineUserAdd } satisfies NavLinkItem,
          { href: "/plataforma", label: "Plataforma", icon: HiOutlineShieldCheck } satisfies NavLinkItem,
        ]
      : []),
    items[items.length - 1],
  ];
  const { notifications, members, locationInvites, expenses } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const profileName = me?.nome || user?.displayName || user?.email || "Conta";
  const profilePhoto = me?.foto || user?.photoURL;
  const pendingInvites = locationInvites.filter((invite) => invite.inviteeUid === user?.uid && invite.status === "pendente").length;
  const unread = notifications.filter((item) => !item.lida).length + pendingInvites + expenses.filter((expense) => isExpenseAlert(expense)).length;
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabbarHidden, setTabbarHidden] = useState(false);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const lastScrollY = useRef(0);
  const mobileTitle = meta.title !== "Painel" ? meta.title : titleForPath(pathname);
  const { openPreferences } = useCookieConsent();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("psy-sidebar") === "1");
    setOpenGroup(groupForPath(menu, pathname));
  }, []);

  useEffect(() => {
    setOpenGroup(groupForPath(menu, pathname));
  }, [pathname]);

  useEffect(() => {
    actionRef.current = undefined;
    setMeta({ title: titleForPath(pathname) });
  }, [pathname, setMeta, actionRef]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 767px)").matches) return;
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (y < 48) setTabbarHidden(false);
      else if (delta > 8) setTabbarHidden(true);
      else if (delta < -8) setTabbarHidden(false);
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem("psy-sidebar", next ? "1" : "0");
    setCollapsed(next);
    setOpenGroup(next ? null : groupForPath(menu, pathname));
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden bg-teal pb-16 pt-6 text-white transition-[width,padding] duration-300 ease-out md:flex ${
          collapsed ? "w-[4.75rem] px-2" : "w-72 px-4"
        }`}
      >
        <div className={`flex shrink-0 gap-2 transition-[justify-content] duration-300 ${collapsed ? "flex-col items-center" : "items-center justify-between"}`}>
          <Link
            href="/admin"
            aria-label="Psy Manager"
            className={`flex min-w-0 items-center overflow-hidden ${collapsed ? "justify-center" : "rounded-md bg-white px-2 py-1.5"}`}
          >
            <BrandLogo variant={collapsed ? "mark" : "lockup"} height={collapsed ? 34 : 44} />
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={toggleCollapsed}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-transparent text-white/80 transition-colors duration-300 hover:border-white hover:text-white"
          >
            {collapsed ? <HiOutlineChevronRight size={20} /> : <HiOutlineChevronLeft size={20} />}
          </button>
        </div>
        <LayoutGroup id="admin-sidebar">
          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {menu.map((entry) =>
              isGroup(entry) ? (
                <NavGroup
                  key={entry.label}
                  item={entry}
                  collapsed={collapsed}
                  pathname={pathname}
                  open={openGroup === entry.label}
                  onToggle={() => toggleGroup(entry.label)}
                  onCookiePreferences={openPreferences}
                />
              ) : (
                <NavAnchor key={entry.href} item={entry} collapsed={collapsed} pathname={pathname} unread={unread} />
              )
            )}
          </nav>
        </LayoutGroup>
        <div className="shrink-0 border-t border-white/15 pt-4">
          <Link
            href="/admin/configuracoes"
            title={collapsed ? profileName : undefined}
            className={`flex items-center overflow-hidden rounded-md py-2 transition-[gap,padding] duration-300 hover:bg-white/10 ${collapsed ? "justify-center" : "gap-3 px-2"}`}
          >
            <Avatar name={profileName} src={profilePhoto} size={40} light />
            <span className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[12rem] opacity-100"}`}>
              <span className="block truncate text-sm font-medium">{profileName}</span>
              <span className="block truncate text-xs text-white/70">{user?.email}</span>
            </span>
          </Link>
          <button
            type="button"
            title={collapsed ? "Sair" : undefined}
            className={`mt-3 flex w-full items-center overflow-hidden rounded-md border border-transparent py-2 text-sm text-white/80 transition-[color,border-color,padding,gap] duration-300 hover:border-white hover:bg-transparent hover:text-white ${
              collapsed ? "justify-center px-0" : "gap-2 px-3"
            }`}
            onClick={async () => {
              await logout();
              router.replace("/admin/login");
            }}
          >
            <HiOutlineLogout size={18} className="shrink-0" />
            <FadeLabel show={!collapsed}>Sair</FadeLabel>
          </button>
        </div>
      </aside>

      <MobileHeader title={mobileTitle} action={actionRef.current} onOpenMenu={() => setMobileOpen(true)} />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        id="admin-mobile-nav"
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Menu do painel"
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-teal px-4 text-white transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" aria-label="Psy Manager" className="rounded-md bg-white px-2 py-1" onClick={() => setMobileOpen(false)}>
            <BrandLogo variant="lockup" height={36} />
          </Link>
          <button
            ref={mobileCloseRef}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md border border-white/25"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          >
            <HiOutlineX size={22} />
          </button>
        </div>
        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
        }}>
          {menu.map((entry) =>
            isGroup(entry) ? (
              <NavGroup
                key={entry.label}
                item={entry}
                collapsed={false}
                pathname={pathname}
                open={openGroup === entry.label}
                onToggle={() => toggleGroup(entry.label)}
                onCookiePreferences={() => {
                  setMobileOpen(false);
                  openPreferences();
                }}
              />
            ) : (
              <NavAnchor key={entry.href} item={entry} collapsed={false} pathname={pathname} unread={unread} />
            )
          )}
        </nav>
        <div className="shrink-0 border-t border-white/15 pt-4">
          <p className="truncate px-2 text-sm font-medium">{profileName}</p>
          <p className="truncate px-2 text-xs text-white/70">{user?.email}</p>
          <button
            type="button"
            className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-md border border-transparent px-3 text-sm text-white/80"
            onClick={async () => {
              await logout();
              router.replace("/admin/login");
            }}
          >
            <HiOutlineLogout size={18} />
            Sair
          </button>
        </div>
      </div>

      <MobileTabBar pathname={pathname} hidden={tabbarHidden} menuOpen={mobileOpen} onOpenMenu={() => setMobileOpen(true)} />

      <div className={`pb-[calc(6.25rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-out md:pb-0 ${collapsed ? "md:pl-[4.75rem]" : "md:pl-72"}`}>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-5 sm:py-6 md:py-10">
          <AdminPageMotion routeKey={pathname}>{children}</AdminPageMotion>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminPageMetaProvider>
      <AdminShellInner>{children}</AdminShellInner>
    </AdminPageMetaProvider>
  );
}
