"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { HiOutlineCalendar, HiOutlineHome, HiOutlineMenu, HiOutlinePlus, HiOutlineUsers } from "react-icons/hi";
import QuickCreateSheet from "@/components/admin/mobile/QuickCreateSheet";
import MobileMenuSheet, { type MobileMenuEntry } from "@/components/admin/mobile/MobileMenuSheet";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type TabItem = {
  href?: string;
  label: string;
  icon: typeof HiOutlineHome;
  onClick?: () => void;
  current?: boolean;
  expanded?: boolean;
};

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function primaryFabAction(pathname: string): string | null {
  if (pathname.startsWith("/admin/agenda")) return "/admin/agenda?novo=1";
  if (pathname.startsWith("/admin/financeiro")) return "/admin/financeiro?novo=1";
  if (pathname === "/admin/pacientes" || pathname.startsWith("/admin/pacientes?")) return "/admin/pacientes?novo=1";
  if (/^\/admin\/pacientes\/[^/]+$/.test(pathname)) return `${pathname}?agendar=1`;
  return null;
}

export default function MobileTabBar({
  pathname,
  hidden,
  menu,
  onLogout,
  onCookiePreferences,
}: {
  pathname: string;
  hidden: boolean;
  menu: MobileMenuEntry[];
  onLogout: () => void | Promise<void>;
  onCookiePreferences: () => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    setMenuOpen(false);
    setQuickOpen(false);
  }, [pathname]);

  const tabs: TabItem[] = [
    { href: "/admin", label: "Início", icon: HiOutlineHome, current: isCurrent("/admin", pathname) },
    { href: "/admin/agenda", label: "Agenda", icon: HiOutlineCalendar, current: isCurrent("/admin/agenda", pathname) },
    { href: "/admin/pacientes", label: "Pacientes", icon: HiOutlineUsers, current: isCurrent("/admin/pacientes", pathname) },
    {
      label: "Menu",
      icon: HiOutlineMenu,
      onClick: () => {
        setQuickOpen(false);
        setMenuOpen((open) => !open);
      },
      current: menuOpen,
      expanded: menuOpen,
    },
  ];

  function renderTab(item: TabItem) {
    const Icon = item.icon;
    const current = item.current ?? false;
    const content = (
      <span
        className={`relative flex w-full min-w-0 flex-col items-center justify-end gap-0.5 rounded-md px-0.5 pb-1 pt-1.5 transition-colors ${
          current ? "bg-teal/12" : ""
        }`}
      >
        <span className="grid h-9 w-9 place-items-center">
          <Icon size={21} className={current ? "text-teal" : "text-teal/85"} aria-hidden />
        </span>
        <span
          className={`max-w-full px-0.5 text-center text-[11px] font-semibold leading-tight ${
            current ? "text-teal" : "text-teal/65"
          }`}
        >
          {item.label}
        </span>
      </span>
    );

    const className =
      "relative flex min-w-0 flex-col items-stretch justify-end px-0.5 pb-0.5 pt-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

    if (item.href) {
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current ? "page" : undefined}
          className={className}
          onClick={() => {
            setQuickOpen(false);
            setMenuOpen(false);
          }}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        className={className}
        aria-expanded={item.expanded}
        aria-controls="admin-mobile-menu-sheet"
        data-testid="mobile-tabbar-menu"
        onClick={item.onClick}
      >
        {content}
      </button>
    );
  }

  function onFabClick() {
    setMenuOpen(false);
    const direct = primaryFabAction(pathname);
    if (direct) {
      setQuickOpen(false);
      router.push(direct);
      return;
    }
    setQuickOpen((open) => !open);
  }

  return (
    <>
      <QuickCreateSheet open={quickOpen} onClose={() => setQuickOpen(false)} pathname={pathname} />
      <MobileMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        menu={menu}
        pathname={pathname}
        onLogout={onLogout}
        onCookiePreferences={onCookiePreferences}
      />
      <nav
        className={`admin-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out lg:hidden ${
          hidden ? "translate-y-[120%]" : "translate-y-0"
        }`}
        aria-label="Atalhos"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto mx-2 sm:mx-3">
          <div
            className="grid grid-cols-5 items-end gap-0 rounded-lg border border-[#e3ebe4] bg-white/95 px-0.5 pb-1.5 pt-2 shadow-[0_16px_48px_rgba(36,48,40,0.14)] backdrop-blur-md sm:px-1"
            data-testid="mobile-tabbar-shell"
          >
            {tabs.slice(0, 2).map(renderTab)}
            <div className="flex flex-col items-center justify-end pb-1">
              <motion.button
                type="button"
                data-testid="mobile-tabbar-fab"
                aria-label={quickOpen ? "Fechar ações rápidas" : "Ações rápidas"}
                aria-expanded={quickOpen}
                className="btn-primary grid h-11 w-11 place-items-center !p-0 shadow-[0_10px_28px_rgba(196,122,90,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                onClick={onFabClick}
                animate={{ rotate: quickOpen ? 45 : 0 }}
                transition={reduced ? { duration: 0 } : springNav}
                whileTap={reduced ? undefined : { scale: 0.96 }}
              >
                <HiOutlinePlus size={22} aria-hidden />
              </motion.button>
              <span className="mt-1 h-[0.95rem]" aria-hidden />
            </div>
            {tabs.slice(2).map(renderTab)}
          </div>
        </div>
      </nav>
    </>
  );
}
