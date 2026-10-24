"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, type ComponentType } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { HiOutlineLogout, HiOutlineX } from "react-icons/hi";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export type MobileMenuIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

export type MobileMenuLink = {
  href: string;
  label: string;
  icon: MobileMenuIcon;
};

export type MobileMenuAction = {
  label: string;
  icon: MobileMenuIcon;
  action: "cookie-preferences";
};

export type MobileMenuGroup = {
  label: string;
  icon: MobileMenuIcon;
  children: (MobileMenuLink | MobileMenuAction)[];
};

export type MobileMenuEntry = MobileMenuLink | MobileMenuGroup;

const TAB_BAR_HREFS = new Set(["/admin", "/admin/agenda", "/admin/pacientes", "/admin/financeiro"]);

function isGroup(entry: MobileMenuEntry): entry is MobileMenuGroup {
  return "children" in entry;
}

function isLink(child: MobileMenuLink | MobileMenuAction): child is MobileMenuLink {
  return "href" in child;
}

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function sheetSections(menu: MobileMenuEntry[]) {
  const sections: { title: string; items: (MobileMenuLink | MobileMenuAction)[] }[] = [];

  for (const entry of menu) {
    if (isGroup(entry)) {
      const children = entry.children.filter((child) => isLink(child) && !TAB_BAR_HREFS.has(child.href));
      if (children.length) sections.push({ title: entry.label, items: children });
      continue;
    }
    if (!TAB_BAR_HREFS.has(entry.href)) {
      sections.push({ title: "Geral", items: [entry] });
    }
  }

  const merged: { title: string; items: (MobileMenuLink | MobileMenuAction)[] }[] = [];
  for (const section of sections) {
    const last = merged[merged.length - 1];
    if (last && last.title === section.title) {
      last.items.push(...section.items);
    } else {
      merged.push({ ...section, items: [...section.items] });
    }
  }
  return merged;
}

function focusableIn(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
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
  menu: MobileMenuEntry[];
  pathname: string;
  onLogout: () => void | Promise<void>;
  onCookiePreferences: () => void;
}) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 220], [1, 0.25]);

  const sections = sheetSections(menu);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" aria-hidden={false}>
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
        className="absolute inset-x-0 bottom-0 flex max-h-[min(82dvh,640px)] flex-col rounded-t-[1.35rem] border border-[#e7eee8] bg-white shadow-[0_-12px_48px_rgba(36,48,40,0.16)]"
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
              className="grid h-10 w-10 place-items-center rounded-full text-muted"
              aria-label="Fechar menu"
              onClick={onClose}
            >
              <HiOutlineX size={20} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
          {sections.map((section) => (
            <section key={section.title} className="mb-4">
              <p className="mb-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{section.title}</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  if (!isLink(item)) {
                    return (
                      <li key={item.label} className="sm:col-span-1">
                        <button
                          type="button"
                          className="motion-press flex min-h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-sky-soft/80"
                          onClick={() => {
                            onClose();
                            onCookiePreferences();
                          }}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-soft text-teal">
                            <Icon size={18} aria-hidden />
                          </span>
                          {item.label}
                        </button>
                      </li>
                    );
                  }
                  const current = isCurrent(item.href, pathname);
                  return (
                    <li key={item.href} className="sm:col-span-1">
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={current ? "page" : undefined}
                        className={`motion-press flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                          current ? "border-teal/25 bg-sky-soft text-teal" : "border-transparent text-ink hover:bg-sky-soft/80"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${current ? "bg-teal text-white" : "bg-sky-soft text-teal"}`}
                        >
                          <Icon size={18} aria-hidden />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <div className="shrink-0 border-t border-[#eef2ee] px-3 pt-2">
          <button
            type="button"
            className="motion-press flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent"
            onClick={async () => {
              onClose();
              await onLogout();
            }}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f6e6df] text-accent">
              <HiOutlineLogout size={18} aria-hidden />
            </span>
            Sair
          </button>
        </div>
      </motion.div>
    </div>
  );
}
