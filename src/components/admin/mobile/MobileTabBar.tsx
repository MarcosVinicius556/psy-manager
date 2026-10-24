"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { HiOutlineCalendar, HiOutlineCash, HiOutlineHome, HiOutlineMenu, HiOutlinePlus, HiOutlineUsers } from "react-icons/hi";
import { TabActiveBubble } from "@/components/admin/motion/NavPill";
import QuickCreateSheet from "@/components/admin/mobile/QuickCreateSheet";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type TabItem = {
  href?: string;
  label: string;
  icon: typeof HiOutlineHome;
  onClick?: () => void;
  current?: boolean;
  controls?: string;
  expanded?: boolean;
};

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function MobileTabBar({
  pathname,
  hidden,
  menuOpen,
  onOpenMenu,
}: {
  pathname: string;
  hidden: boolean;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const reduced = useReducedMotion();

  const tabs: TabItem[] = [
    { href: "/admin", label: "Início", icon: HiOutlineHome, current: isCurrent("/admin", pathname) },
    { href: "/admin/agenda", label: "Agenda", icon: HiOutlineCalendar, current: isCurrent("/admin/agenda", pathname) },
    { href: "/admin/pacientes", label: "Pacientes", icon: HiOutlineUsers, current: isCurrent("/admin/pacientes", pathname) },
    { href: "/admin/financeiro", label: "Financeiro", icon: HiOutlineCash, current: isCurrent("/admin/financeiro", pathname) },
    {
      label: "Menu",
      icon: HiOutlineMenu,
      onClick: onOpenMenu,
      current: menuOpen,
      controls: "admin-mobile-nav",
      expanded: menuOpen,
    },
  ];

  function renderTab(item: TabItem) {
    const Icon = item.icon;
    const current = item.current ?? false;
    const content = (
      <>
        {current ? <TabActiveBubble /> : null}
        <span className="relative z-10 grid min-h-11 min-w-11 place-items-center">
          <Icon size={22} className={current ? "text-white" : "text-teal/85"} aria-hidden />
        </span>
        <span
          className={`relative z-10 max-w-full truncate px-0.5 text-center text-[0.62rem] font-semibold leading-tight ${
            current ? "text-white" : "text-teal/70 opacity-80"
          }`}
        >
          {item.label}
        </span>
      </>
    );

    const className =
      "relative flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

    if (item.href) {
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current ? "page" : undefined}
          className={className}
          onClick={() => setQuickOpen(false)}
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
        aria-controls={item.controls}
        onClick={() => {
          setQuickOpen(false);
          item.onClick?.();
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <>
      <QuickCreateSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
      <nav
        className={`admin-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out md:hidden ${
          hidden ? "translate-y-[120%]" : "translate-y-0"
        }`}
        aria-label="Atalhos"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto relative mx-3">
          <LayoutGroup id="mobile-tabbar">
            <div className="relative flex items-stretch justify-between gap-0.5 rounded-full border border-[#e3ebe4] bg-white/95 px-1 py-1 shadow-[0_16px_48px_rgba(36,48,40,0.14)] backdrop-blur-md">
              <div className="flex min-w-0 flex-1 justify-evenly">{tabs.slice(0, 2).map(renderTab)}</div>
              <div className="w-10 shrink-0" aria-hidden />
              <div className="flex min-w-0 flex-1 justify-evenly">{tabs.slice(2, 4).map(renderTab)}</div>
              <div className="flex w-14 shrink-0 justify-center">{renderTab(tabs[4])}</div>
            </div>
          </LayoutGroup>

          <motion.button
            type="button"
            aria-label={quickOpen ? "Fechar ações rápidas" : "Ações rápidas"}
            aria-expanded={quickOpen}
            className="pointer-events-auto absolute left-1/2 top-0 z-20 grid h-12 w-12 -translate-x-1/2 -translate-y-[42%] place-items-center rounded-full border border-accent bg-accent text-white shadow-[0_12px_32px_rgba(196,122,90,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onClick={() => setQuickOpen((open) => !open)}
            animate={{ rotate: quickOpen ? 45 : 0 }}
            transition={reduced ? { duration: 0 } : springNav}
            whileTap={reduced ? undefined : { scale: 0.96 }}
          >
            <HiOutlinePlus size={24} aria-hidden />
          </motion.button>
        </div>
      </nav>
    </>
  );
}
