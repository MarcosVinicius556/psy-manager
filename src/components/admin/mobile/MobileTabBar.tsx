"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { HiOutlineCalendar, HiOutlineCash, HiOutlineHome, HiOutlinePlus, HiOutlineUsers } from "react-icons/hi";
import { TabActiveBubble } from "@/components/admin/motion/NavPill";
import QuickCreateSheet from "@/components/admin/mobile/QuickCreateSheet";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type TabLink = {
  kind: "link";
  href: string;
  label: string;
  icon: typeof HiOutlineHome;
};

type TabFab = {
  kind: "fab";
};

type TabItem = TabLink | TabFab;

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function contextualCreateHref(pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname.startsWith("/admin/agenda")) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("novo", "1");
    next.delete("edit");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : `${pathname}?novo=1`;
  }
  if (pathname === "/admin/pacientes") {
    return "/admin/pacientes?novo=1";
  }
  if (pathname.startsWith("/admin/pacientes/") && pathname !== "/admin/pacientes/novo") {
    const patientId = pathname.split("/").filter(Boolean).pop();
    if (patientId) {
      return `/admin/agenda?novo=1&patientId=${encodeURIComponent(patientId)}`;
    }
  }
  if (pathname.startsWith("/admin/financeiro")) {
    return "/admin/financeiro?novo=1";
  }
  return null;
}

export default function MobileTabBar({ pathname, hidden }: { pathname: string; hidden: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quickOpen, setQuickOpen] = useState(false);
  const reduced = useReducedMotion();

  const tabs: TabItem[] = [
    { kind: "link", href: "/admin", label: "Início", icon: HiOutlineHome },
    { kind: "link", href: "/admin/agenda", label: "Agenda", icon: HiOutlineCalendar },
    { kind: "fab" },
    { kind: "link", href: "/admin/pacientes", label: "Pacientes", icon: HiOutlineUsers },
    { kind: "link", href: "/admin/financeiro", label: "Financeiro", icon: HiOutlineCash },
  ];

  function handleFabClick() {
    const direct = contextualCreateHref(pathname, searchParams);
    if (direct) {
      setQuickOpen(false);
      router.push(direct);
      return;
    }
    setQuickOpen((open) => !open);
  }

  function renderLink(item: TabLink) {
    const Icon = item.icon;
    const current = isCurrent(item.href, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={current ? "page" : undefined}
        className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        onClick={() => setQuickOpen(false)}
      >
        <span className="relative grid h-10 w-10 shrink-0 place-items-center">
          {current ? <TabActiveBubble /> : null}
          <Icon size={22} className={`relative z-10 ${current ? "text-white" : "text-teal/85"}`} aria-hidden />
        </span>
        <span
          className={`max-w-full truncate px-0.5 text-center text-[0.62rem] font-semibold leading-tight ${
            current ? "text-teal" : "text-teal/65"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  }

  function renderFab() {
    return (
      <div key="fab" className="flex min-w-0 flex-1 flex-col items-center justify-end pb-0.5">
        <motion.button
          type="button"
          aria-label={quickOpen ? "Fechar ações rápidas" : "Criar"}
          aria-expanded={quickOpen}
          className="relative z-10 grid h-11 w-11 -translate-y-1 place-items-center rounded-full border border-accent bg-accent text-white shadow-[0_10px_28px_rgba(196,122,90,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={handleFabClick}
          animate={{ rotate: quickOpen ? 45 : 0 }}
          transition={reduced ? { duration: 0 } : springNav}
          whileTap={reduced ? undefined : { scale: 0.96 }}
        >
          <HiOutlinePlus size={24} aria-hidden />
        </motion.button>
        <span className="mt-0.5 text-[0.62rem] font-semibold leading-tight text-transparent" aria-hidden>
          +
        </span>
      </div>
    );
  }

  return (
    <>
      <QuickCreateSheet open={quickOpen} onClose={() => setQuickOpen(false)} pathname={pathname} />
      <nav
        className={`admin-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out md:hidden ${
          hidden ? "translate-y-[120%]" : "translate-y-0"
        }`}
        aria-label="Atalhos"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto mx-3 pt-1">
          <LayoutGroup id="mobile-tabbar">
            <div
              className="grid grid-cols-5 items-end gap-0 rounded-full border border-[#e3ebe4] bg-white/95 px-0.5 pb-1 pt-2 shadow-[0_16px_48px_rgba(36,48,40,0.14)] backdrop-blur-md"
            >
              {tabs.map((item) => (item.kind === "fab" ? renderFab() : renderLink(item)))}
            </div>
          </LayoutGroup>
        </div>
      </nav>
    </>
  );
}
