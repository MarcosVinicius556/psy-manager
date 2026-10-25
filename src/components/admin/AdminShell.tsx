"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup } from "motion/react";
import { HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineLogout } from "react-icons/hi";
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
import {
  adminGroupForPath,
  adminTitleForPath,
  buildAdminMenu,
  isAdminNavCurrent,
  isAdminNavGroup,
  isAdminNavLinkChild,
  type AdminNavEntry,
  type AdminNavGroup,
  type AdminNavLink,
} from "@/lib/admin/admin-nav";
import { useCookieConsent } from "@/components/legal/CookieConsentProvider";

type NavLinkItem = AdminNavLink;
type NavGroupItem = AdminNavGroup;
type NavEntry = AdminNavEntry;

function isNavLinkChild(child: NavGroupItem["children"][number]) {
  return isAdminNavLinkChild(child);
}

function isGroup(entry: NavEntry): entry is NavGroupItem {
  return isAdminNavGroup(entry);
}

function isCurrent(href: string, pathname: string) {
  return isAdminNavCurrent(href, pathname);
}

function titleForPath(pathname: string) {
  return adminTitleForPath(pathname);
}

function groupForPath(menu: NavEntry[], pathname: string) {
  return adminGroupForPath(menu, pathname);
}

function navShellClass(collapsed: boolean, nested = false) {
  return `relative flex items-center overflow-hidden rounded-md border border-transparent text-sm font-medium transition-[color,background-color] duration-200 ${
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
  const menu = buildAdminMenu(role);
  const { notifications, members, locationInvites, expenses } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const profileName = me?.nome || user?.displayName || user?.email || "Conta";
  const profilePhoto = me?.foto || user?.photoURL;
  const pendingInvites = locationInvites.filter((invite) => invite.inviteeUid === user?.uid && invite.status === "pendente").length;
  const unread = notifications.filter((item) => !item.lida).length + pendingInvites + expenses.filter((expense) => isExpenseAlert(expense)).length;
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [tabbarHidden, setTabbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const mobileTitle = meta.title !== "Painel" ? meta.title : titleForPath(pathname);
  const { openPreferences } = useCookieConsent();

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
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) return;
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
        className={`fixed bottom-4 left-4 top-4 z-30 hidden flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-footer pb-4 pt-5 text-white shadow-[0_28px_80px_rgba(23,47,51,0.22)] transition-[width,padding] duration-300 ease-out lg:flex ${
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

      <MobileHeader title={mobileTitle} action={actionRef.current} />

      <MobileTabBar
        pathname={pathname}
        hidden={tabbarHidden}
        menu={menu}
        onCookiePreferences={openPreferences}
        onLogout={async () => {
          await logout();
          router.replace("/admin/login");
        }}
      />

      <div
        className={`pb-[calc(5.75rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-out lg:pb-8 ${
          collapsed ? "lg:pl-[calc(1rem+4.75rem+1rem)]" : "lg:pl-[calc(1rem+18rem+1rem)]"
        }`}
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-5 sm:py-6 lg:py-8">
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
