"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { HiOutlineCalendar, HiOutlineCash, HiOutlineHome, HiOutlinePlus, HiOutlineUsers } from "react-icons/hi";
import { TabActiveBubble } from "@/components/admin/motion/NavPill";
import QuickCreateSheet from "@/components/admin/mobile/QuickCreateSheet";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type TabItem = {
  href: string;
  label: string;
  icon: typeof HiOutlineHome;
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

export default function MobileTabBar({ pathname, hidden }: { pathname: string; hidden: boolean }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const reduced = useReducedMotion();
  const router = useRouter();

  const tabs: TabItem[] = [
    { href: "/admin", label: "Início", icon: HiOutlineHome },
    { href: "/admin/agenda", label: "Agenda", icon: HiOutlineCalendar },
    { href: "/admin/pacientes", label: "Pacientes", icon: HiOutlineUsers },
    { href: "/admin/financeiro", label: "Financeiro", icon: HiOutlineCash },
  ];

  function renderTab(item: TabItem) {
    const Icon = item.icon;
    const current = isCurrent(item.href, pathname);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={current ? "page" : undefined}
        className="relative flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 px-0.5 pb-1 pt-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        onClick={() => setQuickOpen(false)}
      >
        <span className="relative grid h-10 w-11 place-items-center">
          {current ? <TabActiveBubble /> : null}
          <Icon size={22} className={`relative z-10 ${current ? "text-white" : "text-teal/85"}`} aria-hidden />
        </span>
        <span
          className={`relative z-10 max-w-full truncate text-[0.62rem] font-semibold leading-tight ${
            current ? "text-teal" : "text-teal/65"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  }

  function onFabClick() {
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
      <nav
        className={`admin-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out lg:hidden ${
          hidden ? "translate-y-[120%]" : "translate-y-0"
        }`}
        aria-label="Atalhos"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto mx-3">
          <LayoutGroup id="mobile-tabbar">
            <div
              className="grid grid-cols-5 items-end gap-0 rounded-full border border-[#e3ebe4] bg-white/95 px-1 pb-1.5 pt-2 shadow-[0_16px_48px_rgba(36,48,40,0.14)] backdrop-blur-md"
              data-testid="mobile-tabbar-shell"
            >
              {tabs.slice(0, 2).map(renderTab)}
              <div className="flex flex-col items-center justify-end pb-0.5">
                <motion.button
                  type="button"
                  data-testid="mobile-tabbar-fab"
                  aria-label={quickOpen ? "Fechar ações rápidas" : "Ações rápidas"}
                  aria-expanded={quickOpen}
                  className="relative z-10 -mt-4 grid h-11 w-11 place-items-center rounded-full border border-accent bg-accent text-white shadow-[0_10px_28px_rgba(196,122,90,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          </LayoutGroup>
        </div>
      </nav>
    </>
  );
}
