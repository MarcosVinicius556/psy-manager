"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { HiOutlineChevronDown, HiOutlineLogout, HiOutlineX } from "react-icons/hi";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import {
  adminGroupForPath,
  isAdminNavCurrent,
  isAdminNavGroup,
  isAdminNavLinkChild,
  menuSheetShowsLink,
  type AdminNavAction,
  type AdminNavEntry,
  type AdminNavGroup,
  type AdminNavLink,
  visibleMenuGroupChildren,
} from "@/lib/admin/admin-nav";

export type MobileMenuEntry = AdminNavEntry;
export type MobileMenuLink = AdminNavLink;
export type MobileMenuAction = AdminNavAction;
export type MobileMenuGroup = AdminNavGroup;
export type { AdminNavIcon as MobileMenuIcon } from "@/lib/admin/admin-nav";

function focusableIn(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

function rowClass(current = false) {
  return `motion-press flex min-h-11 w-full items-center justify-start gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium ${
    current ? "bg-sky-soft text-teal" : "text-ink hover:bg-sky-soft/80"
  }`;
}

function iconShell(current = false) {
  return `grid h-9 w-9 shrink-0 place-items-center rounded-md ${current ? "bg-teal text-white" : "bg-sky-soft text-teal"}`;
}

function groupHeaderClass(active = false) {
  return `motion-press flex min-h-11 w-full items-center justify-start gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold hover:bg-sky-soft/80 ${
    active ? "text-teal" : "text-ink"
  }`;
}

function MenuLinkRow({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavLink;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const current = isAdminNavCurrent(item.href, pathname);
  return (
    <Link
      href={item.href}
      data-testid="mobile-menu-item"
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={rowClass(current)}
    >
      <span className={iconShell(current)}>
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}

function MenuActionRow({
  item,
  onActivate,
}: {
  item: AdminNavAction;
  onActivate: () => void;
}) {
  const Icon = item.icon;
  return (
    <button type="button" data-testid="mobile-menu-item" className={rowClass()} onClick={onActivate}>
      <span className={iconShell()}>
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
    </button>
  );
}

function MenuGroupAccordion({
  group,
  pathname,
  open,
  onToggle,
  onNavigate,
  onCookiePreferences,
}: {
  group: AdminNavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  onCookiePreferences: () => void;
}) {
  const reduced = useReducedMotion();
  const Icon = group.icon;
  const children = visibleMenuGroupChildren(group);
  if (children.length === 0) return null;

  const groupActive = group.children.some((child) => isAdminNavLinkChild(child) && isAdminNavCurrent(child.href, pathname));
  const panelId = `mobile-menu-group-panel-${group.label}`;

  return (
    <div className="w-full min-w-0" data-testid={`mobile-menu-group-${group.label}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className={groupHeaderClass(groupActive)}
        onClick={onToggle}
      >
        <span className={iconShell(groupActive && !open)}>
          <Icon size={18} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <HiOutlineChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <motion.div
        id={panelId}
        data-testid={panelId}
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={reduced ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <ul className="flex flex-col gap-1 pb-1 pl-3 pt-1">
          {children.map((child) => (
            <li key={isAdminNavLinkChild(child) ? child.href : child.label} className="w-full min-w-0">
              {isAdminNavLinkChild(child) ? (
                <MenuLinkRow item={child} pathname={pathname} onNavigate={onNavigate} />
              ) : (
                <MenuActionRow
                  item={child}
                  onActivate={() => {
                    onNavigate();
                    onCookiePreferences();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

export default function MobileMenuSheet({
  open,
  onClose,
  menu,
  pathname,
  onLogout,
  onCookiePreferences,
}: {
  open: boolean;
  onClose: () => void;
  menu: AdminNavEntry[];
  pathname: string;
  onLogout: () => void | Promise<void>;
  onCookiePreferences: () => void;
}) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 220], [1, 0.25]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOpenGroup(adminGroupForPath(menu, pathname));
  }, [menu, open, pathname]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open || event.key !== "Tab" || !panelRef.current) return;
      const nodes = focusableIn(panelRef.current);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [open]
  );

  useEffect(() => {
    if (!open) return;
    dragY.set(0);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dragY, handleKeyDown, onClose, open]);

  function onDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.y > 72 || info.velocity.y > 420) onClose();
    else dragY.set(0);
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 desk:hidden" aria-hidden={false}>
      <motion.button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-ink/40"
        style={reduced ? undefined : { opacity: backdropOpacity }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        id="admin-mobile-menu-sheet"
        data-testid="admin-mobile-menu-sheet"
        className="absolute inset-x-0 bottom-0 flex max-h-[min(82dvh,640px)] flex-col overflow-x-hidden rounded-t-lg bg-white shadow-[0_-12px_48px_rgba(36,48,40,0.16)]"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          y: reduced ? 0 : dragY,
        }}
        initial={reduced ? false : { y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={reduced ? { duration: 0 } : springNav}
        drag={reduced ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.35 }}
        onDragEnd={onDragEnd}
      >
        <div className="flex shrink-0 flex-col items-center px-4 pt-2">
          <div className="mb-2 h-1 w-10 rounded-full bg-[#d7e0d8]" aria-hidden />
          <div className="flex w-full items-center justify-between gap-2 pb-2">
            <h2 id={titleId} className="text-base font-semibold text-teal">Menu</h2>
            <button
              ref={closeRef}
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-sky-soft/80"
              aria-label="Fechar menu"
              onClick={onClose}
            >
              <HiOutlineX size={20} />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          data-testid="mobile-menu-scroll"
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-2"
        >
          <div className="flex w-full min-w-0 flex-col gap-1">
            {menu.map((entry) => {
              if (isAdminNavGroup(entry)) {
                const visible = visibleMenuGroupChildren(entry);
                if (visible.length === 0) return null;
                return (
                  <MenuGroupAccordion
                    key={entry.label}
                    group={entry}
                    pathname={pathname}
                    open={openGroup === entry.label}
                    onToggle={() => toggleGroup(entry.label)}
                    onNavigate={onClose}
                    onCookiePreferences={onCookiePreferences}
                  />
                );
              }
              if (!menuSheetShowsLink(entry)) return null;
              return (
                <MenuLinkRow key={entry.href} item={entry} pathname={pathname} onNavigate={onClose} />
              );
            })}
          </div>
        </div>
        <div className="shrink-0 border-t border-[#eef2ee] px-3 pt-2">
          <button
            type="button"
            className="motion-press flex min-h-11 w-full items-center justify-start gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-accent hover:bg-[#f6e6df]/60"
            onClick={async () => {
              onClose();
              await onLogout();
            }}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f6e6df] text-accent">
              <HiOutlineLogout size={18} aria-hidden />
            </span>
            Sair
          </button>
        </div>
      </motion.div>
    </div>
  );
}
