"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { HiOutlineChatAlt2, HiOutlineHome, HiOutlineMenu, HiOutlineUserGroup } from "react-icons/hi";
import MobileMenuSheet, { type MobileMenuEntry } from "@/components/admin/mobile/MobileMenuSheet";
import { buildPlatformMenu, platformShellNavConfig } from "@/lib/platform/platform-nav";
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
  return platformShellNavConfig.isNavCurrent(href, pathname);
}

export default function PlatformMobileTabBar({
  pathname,
  hidden,
  menu,
  role,
  onLogout,
  onCookiePreferences,
}: {
  pathname: string;
  hidden: boolean;
  menu: MobileMenuEntry[];
  role: string | null | undefined;
  onLogout: () => void | Promise<void>;
  onCookiePreferences: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const supportOnly = role === "support";
  const menuHasOverflow = buildPlatformMenu(role).length > 1 || menu.some((entry) => "children" in entry);

  const tabs: TabItem[] = supportOnly
    ? [{ href: "/plataforma/suporte", label: "Suporte", icon: HiOutlineChatAlt2, current: isCurrent("/plataforma/suporte", pathname) }]
    : [
        { href: "/plataforma", label: "Painel", icon: HiOutlineHome, current: isCurrent("/plataforma", pathname) },
        { href: "/plataforma/contas", label: "Contas", icon: HiOutlineUserGroup, current: isCurrent("/plataforma/contas", pathname) },
        { href: "/plataforma/suporte", label: "Suporte", icon: HiOutlineChatAlt2, current: isCurrent("/plataforma/suporte", pathname) },
        ...(menuHasOverflow
          ? [
              {
                label: "Menu",
                icon: HiOutlineMenu,
                onClick: () => setMenuOpen((open) => !open),
                current: menuOpen,
                expanded: menuOpen,
              } satisfies TabItem,
            ]
          : []),
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
          onClick={() => setMenuOpen(false)}
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
        aria-controls="platform-mobile-menu-sheet"
        data-testid="platform-mobile-tabbar-menu"
        onClick={item.onClick}
      >
        {content}
      </button>
    );
  }

  const columnCount = tabs.length;

  return (
    <>
      <MobileMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        menu={menu}
        pathname={pathname}
        onLogout={onLogout}
        onCookiePreferences={onCookiePreferences}
        navConfig={platformShellNavConfig}
      />
      <nav
        className={`admin-tabbar pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out desk:hidden ${
          hidden ? "translate-y-[120%]" : "translate-y-0"
        }`}
        aria-label="Plataforma"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto mx-2 sm:mx-3">
          <motion.div
            className="grid items-end gap-0 rounded-lg border border-[#e3ebe4] bg-white/95 px-0.5 pb-1.5 pt-2 shadow-[0_16px_48px_rgba(36,48,40,0.14)] backdrop-blur-md sm:px-1"
            data-testid="platform-mobile-tabbar-shell"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
            layout
            transition={reduced ? { duration: 0 } : springNav}
          >
            {tabs.map(renderTab)}
          </motion.div>
        </div>
      </nav>
    </>
  );
}
