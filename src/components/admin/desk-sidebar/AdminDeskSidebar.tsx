"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { LayoutGroup, motion } from "motion/react";
import { HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineLogout } from "react-icons/hi";
import BrandLogo from "@/components/BrandLogo";
import Avatar from "@/components/admin/Avatar";
import { SidebarActivePill } from "@/components/admin/motion/NavPill";
import { NavTooltip } from "@/components/admin/desk-sidebar/NavTooltip";
import {
  iconTone,
  labelTone,
  navRowClass,
  navRowTone,
  SIDEBAR_COLLAPSED_W,
  SIDEBAR_EXPANDED_W,
  SIDEBAR_EXPANDED_WIDE_W,
} from "@/components/admin/desk-sidebar/nav-styles";
import {
  isAdminNavCurrent,
  isAdminNavGroup,
  isAdminNavLinkChild,
  type AdminNavEntry,
  type AdminNavGroup,
  type AdminNavLink,
} from "@/lib/admin/admin-nav";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type NavLinkItem = AdminNavLink;
type NavGroupItem = AdminNavGroup;
type NavEntry = AdminNavEntry;

function isNavLinkChild(child: NavGroupItem["children"][number]) {
  return isAdminNavLinkChild(child);
}

function isGroup(entry: NavEntry): entry is NavGroupItem {
  return isAdminNavGroup(entry);
}

type NavCurrentFn = (href: string, pathname: string) => boolean;

function FadeLabel({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={`overflow-hidden whitespace-nowrap ${className ?? ""}`}
      initial={false}
      animate={{
        opacity: show ? 1 : 0,
        maxWidth: show ? 192 : 0,
        marginLeft: show ? 0 : 0,
      }}
      transition={reduced ? { duration: 0 } : springNav}
    >
      {children}
    </motion.span>
  );
}

function wrapCollapsedTooltip(collapsed: boolean, label: string, node: React.ReactElement) {
  if (!collapsed) return node;
  return (
    <NavTooltip label={label} enabled={true}>
      {node}
    </NavTooltip>
  );
}

function NavAnchor({
  item,
  collapsed,
  pathname,
  unread,
  isCurrent,
  notificationsHref,
}: {
  item: NavLinkItem;
  collapsed: boolean;
  pathname: string;
  unread: number;
  isCurrent: NavCurrentFn;
  notificationsHref: string | null;
}) {
  const Icon = item.icon;
  const current = isCurrent(item.href, pathname);
  const link = (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      className={`motion-press ${navRowClass(collapsed)} ${navRowTone(current)}`}
    >
      {current ? <SidebarActivePill /> : null}
      <span className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <span className="relative shrink-0">
          <Icon size={20} className={iconTone(current)} />
          {notificationsHref && item.href === notificationsHref && unread > 0 && (
            <span
              className={`absolute -right-1 -top-1 h-2 w-2 bg-accent transition-opacity duration-300 ${collapsed ? "opacity-100" : "opacity-0"}`}
              style={{ borderRadius: "50%" }}
            />
          )}
        </span>
        <FadeLabel show={!collapsed} className={`flex-1 ${labelTone(current)}`}>
          {item.label}
        </FadeLabel>
        <FadeLabel show={!collapsed && notificationsHref !== null && item.href === notificationsHref && unread > 0}>
          <span className="rounded-[var(--radius-control)] bg-accent px-2 py-0.5 text-xs text-white">{unread}</span>
        </FadeLabel>
      </span>
    </Link>
  );
  return wrapCollapsedTooltip(collapsed, item.label, link);
}

function NavGroup({
  item,
  collapsed,
  pathname,
  open,
  onToggle,
  onCookiePreferences,
  isCurrent,
}: {
  item: NavGroupItem;
  collapsed: boolean;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onCookiePreferences?: () => void;
  isCurrent: NavCurrentFn;
}) {
  const groupActive = item.children.some((child) => isNavLinkChild(child) && isCurrent(child.href, pathname));
  const [box, setBox] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  const flyoutOpen = collapsed && open;
  const reduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  function placeFlyout() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.top, left: rect.right + 10 });
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

  const pillOnGroup = collapsed && groupActive && !open;
  const containsActive = groupActive && !pillOnGroup;

  const groupButton = (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-label={item.label}
      className={`motion-press w-full ${navRowClass(collapsed)} ${navRowTone(pillOnGroup, containsActive)}`}
      onClick={() => {
        if (collapsed) placeFlyout();
        onToggle();
      }}
    >
      {pillOnGroup ? <SidebarActivePill /> : null}
      <Icon size={20} className={`relative z-10 ${iconTone(pillOnGroup)}`} />
      <FadeLabel show={!collapsed} className={`relative z-10 flex-1 text-left ${labelTone(pillOnGroup)}`}>
        {item.label}
      </FadeLabel>
      <HiOutlineChevronDown
        size={16}
        aria-hidden
        className={`relative z-10 shrink-0 transition-[transform,opacity,max-width] duration-300 ${
          collapsed ? "max-w-0 opacity-0" : "max-w-4 opacity-100"
        } ${open && !collapsed ? "rotate-180" : ""}`}
      />
    </button>
  );

  return (
    <div ref={rootRef}>
      {wrapCollapsedTooltip(collapsed, item.label, groupButton)}
      <motion.div
        className={`grid ${collapsed ? "hidden" : ""}`}
        initial={false}
        animate={{ gridTemplateRows: !collapsed && open ? "1fr" : "0fr" }}
        transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={collapsed}
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
                    className={`motion-press ${navRowClass(false, true)} ${navRowTone(false)}`}
                    onClick={() => onCookiePreferences?.()}
                  >
                    <ChildIcon size={18} className={`relative z-10 ${iconTone(false)}`} />
                    <span className="relative z-10 flex-1 text-left">{child.label}</span>
                  </button>
                );
              }
              const childCurrent = isCurrent(child.href, pathname);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={childCurrent ? "page" : undefined}
                  className={`motion-press ${navRowClass(false, true)} ${navRowTone(childCurrent)}`}
                >
                  {childCurrent ? <SidebarActivePill /> : null}
                  <ChildIcon size={18} className={`relative z-10 ${iconTone(childCurrent)}`} />
                  <span className={`relative z-10 flex-1 text-left ${labelTone(childCurrent)}`}>{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
      {mounted &&
        collapsed &&
        flyoutOpen &&
        createPortal(
          <motion.div
            ref={flyoutRef}
            role="menu"
            aria-label={item.label}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 w-56 rounded-[var(--radius-surface)] bg-footer p-1 shadow-[0_24px_64px_rgba(23,47,51,0.38)]"
            style={{ top: box.top, left: box.left }}
            data-testid="admin-sidebar-flyout"
          >
            <p className="px-3 pb-1 pt-2 text-[0.68rem] uppercase tracking-[0.16em] text-leaf">{item.label}</p>
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              if (!isNavLinkChild(child)) {
                return (
                  <button
                    key={child.label}
                    type="button"
                    role="menuitem"
                    className={`motion-press ${navRowClass(false)} ${navRowTone(false)}`}
                    onClick={() => {
                      onToggle();
                      onCookiePreferences?.();
                    }}
                  >
                    <ChildIcon size={18} className={`relative z-10 ${iconTone(false)}`} />
                    <span className="relative z-10 flex-1 text-left">{child.label}</span>
                  </button>
                );
              }
              const childCurrent = isCurrent(child.href, pathname);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  aria-current={childCurrent ? "page" : undefined}
                  className={`motion-press ${navRowClass(false)} ${navRowTone(childCurrent)}`}
                >
                  {childCurrent ? <SidebarActivePill /> : null}
                  <ChildIcon size={18} className={`relative z-10 ${iconTone(childCurrent)}`} />
                  <span className={`relative z-10 flex-1 ${labelTone(childCurrent)}`}>{child.label}</span>
                </Link>
              );
            })}
          </motion.div>,
          document.body
        )}
    </div>
  );
}

export type AdminDeskSidebarProps = {
  menu: NavEntry[];
  pathname: string;
  collapsed: boolean;
  wide: boolean;
  openGroup: string | null;
  onToggleCollapsed: () => void;
  onToggleGroup: (label: string) => void;
  onCookiePreferences?: () => void;
  profileName: string;
  profilePhoto?: string | null;
  profileEmail?: string | null;
  unread: number;
  onLogout: () => void | Promise<void>;
  homeHref?: string;
  profileHref?: string;
  notificationsHref?: string | null;
  brandSubtitle?: string;
  sidebarTestId?: string;
  layoutGroupId?: string;
  isNavCurrent?: NavCurrentFn;
  beforeLogout?: ReactNode;
};

export function AdminDeskSidebar({
  menu,
  pathname,
  collapsed,
  wide,
  openGroup,
  onToggleCollapsed,
  onToggleGroup,
  onCookiePreferences,
  profileName,
  profilePhoto,
  profileEmail,
  unread,
  onLogout,
  homeHref = "/admin",
  profileHref = "/admin/configuracoes",
  notificationsHref = "/admin/notificacoes",
  brandSubtitle,
  sidebarTestId = "admin-desk-sidebar",
  layoutGroupId = "admin-sidebar",
  isNavCurrent = isAdminNavCurrent,
  beforeLogout,
}: AdminDeskSidebarProps) {
  const reduced = useReducedMotion();
  const targetWidth = collapsed ? SIDEBAR_COLLAPSED_W : wide ? SIDEBAR_EXPANDED_WIDE_W : SIDEBAR_EXPANDED_W;

  const avatarLink = (
    <Link
      href={profileHref}
      className={`flex items-center overflow-hidden rounded-[var(--radius-control)] py-2 transition-colors hover:bg-white/10 ${
        collapsed ? "justify-center" : "gap-3 px-2"
      }`}
    >
      <Avatar name={profileName} src={profilePhoto} size={40} light />
      <FadeLabel show={!collapsed} className="min-w-0">
        <span className="block truncate text-sm font-medium">{profileName}</span>
        <span className="block truncate text-xs text-white/70">{profileEmail}</span>
      </FadeLabel>
    </Link>
  );

  const logoutButton = (
    <button
      type="button"
      className={`mt-3 flex w-full items-center overflow-hidden rounded-[var(--radius-control)] py-2 text-sm text-accent transition-colors hover:bg-white/10 hover:text-accent ${
        collapsed ? "justify-center px-0" : "gap-2 px-3"
      }`}
      onClick={() => void onLogout()}
    >
      <HiOutlineLogout size={18} className="shrink-0" aria-hidden />
      <FadeLabel show={!collapsed}>Sair</FadeLabel>
    </button>
  );

  return (
    <motion.aside
      data-testid={sidebarTestId}
      data-collapsed={collapsed ? "true" : "false"}
      initial={false}
      animate={{ width: targetWidth, paddingLeft: collapsed ? 8 : 16, paddingRight: collapsed ? 8 : 16 }}
      transition={reduced ? { duration: 0 } : springNav}
      className="fixed bottom-[var(--admin-sidebar-inset)] left-[var(--admin-sidebar-inset)] top-[var(--admin-sidebar-inset)] z-30 hidden max-w-[calc(100vw-2*var(--admin-sidebar-inset))] flex-col overflow-visible rounded-[var(--radius-surface)] bg-footer pb-4 pt-5 text-white shadow-[0_28px_80px_rgba(23,47,51,0.28)] desk:flex"
    >
      <div
        className={`flex shrink-0 gap-2 transition-[justify-content] duration-300 ${collapsed ? "flex-col items-center" : "items-center justify-between"}`}
      >
        <Link
          href={homeHref}
          aria-label="Psy Manager"
          className={`flex min-w-0 flex-col overflow-hidden ${collapsed ? "items-center justify-center" : "rounded-[var(--radius-control)] bg-white/95 px-2 py-1.5"}`}
        >
          <BrandLogo variant={collapsed ? "mark" : "lockup"} height={collapsed ? 34 : 44} />
          {brandSubtitle && !collapsed ? (
            <span className="mt-1.5 block text-[0.68rem] uppercase tracking-[0.16em] text-leaf">{brandSubtitle}</span>
          ) : null}
        </Link>
      </div>

      <button
        type="button"
        data-testid="admin-sidebar-collapse-toggle"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        onClick={onToggleCollapsed}
        className="absolute -right-2.5 top-[4.25rem] z-40 grid h-9 w-7 place-items-center rounded-[var(--radius-control)] bg-footer text-white/85 shadow-[0_8px_24px_rgba(23,47,51,0.35)] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
      >
        {collapsed ? <HiOutlineChevronRight size={18} aria-hidden /> : <HiOutlineChevronLeft size={18} aria-hidden />}
      </button>

      <LayoutGroup id={layoutGroupId}>
        <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden" aria-label="Menu principal">
          {menu.map((entry) =>
            isGroup(entry) ? (
              <NavGroup
                key={entry.label}
                item={entry}
                collapsed={collapsed}
                pathname={pathname}
                open={openGroup === entry.label}
                onToggle={() => onToggleGroup(entry.label)}
                onCookiePreferences={onCookiePreferences}
                isCurrent={isNavCurrent}
              />
            ) : (
              <NavAnchor
                key={entry.href}
                item={entry}
                collapsed={collapsed}
                pathname={pathname}
                unread={unread}
                isCurrent={isNavCurrent}
                notificationsHref={notificationsHref}
              />
            )
          )}
        </nav>
      </LayoutGroup>

      <div className="shrink-0 pt-4">
        <div className="mb-3 h-px bg-white/12" aria-hidden />
        {wrapCollapsedTooltip(collapsed, profileName, avatarLink)}
        {beforeLogout}
        {wrapCollapsedTooltip(collapsed, "Sair", logoutButton)}
      </div>
    </motion.aside>
  );
}

/** Tailwind cannot see dynamic arbitrary values; use fixed calc classes. */
export function sidebarMainPadding(collapsed: boolean, wide: boolean) {
  if (collapsed) return "desk:pl-[calc(14px+76px+14px)]";
  if (wide) return "desk:pl-[calc(14px+288px+14px)]";
  return "desk:pl-[calc(14px+256px+14px)]";
}
