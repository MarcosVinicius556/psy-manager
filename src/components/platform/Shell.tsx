"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { AdminPageMotion } from "@/components/admin/motion/AdminPageMotion";
import { AdminDeskSidebar, sidebarMainPadding } from "@/components/admin/desk-sidebar/AdminDeskSidebar";
import MobileHeader from "@/components/admin/mobile/MobileHeader";
import PlatformMobileTabBar from "@/components/platform/PlatformMobileTabBar";
import MfaEncouragementBanner from "@/components/platform/MfaEncouragementBanner";
import { useAuth } from "@/lib/admin/auth-context";
import { AdminPageMetaProvider, useAdminPageMeta } from "@/lib/admin/page-meta-context";
import { ADMIN_MOBILE_TABBAR_MEDIA, isNarrowDeskViewport } from "@/lib/admin/layout-breakpoints";
import {
  buildPlatformMenu,
  isPlatformNavCurrent,
  platformGroupForPath,
  platformTitleForPath,
} from "@/lib/platform/platform-nav";
import { useCookieConsent } from "@/components/legal/CookieConsentProvider";

function PlatformShellInner({ children, role }: { children: React.ReactNode; role: string | null | undefined }) {
  const menu = buildPlatformMenu(role);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { meta, actionRef, setMeta } = useAdminPageMeta();
  const [collapsed, setCollapsed] = useState(false);
  const [wide, setWide] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [tabbarHidden, setTabbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const mobileTitle = meta.title !== "Painel" ? meta.title : platformTitleForPath(pathname);
  const { openPreferences } = useCookieConsent();
  const profileName = user?.displayName || user?.email || "Plataforma";
  const profilePhoto = user?.photoURL;

  useEffect(() => {
    const storedCollapsed = window.localStorage.getItem("psy-platform-sidebar") === "1";
    const narrowDesk = isNarrowDeskViewport(window.innerWidth);
    setCollapsed(narrowDesk ? true : storedCollapsed);
    setOpenGroup(narrowDesk ? null : platformGroupForPath(menu, pathname));
    const mq = window.matchMedia("(min-width: 64rem)");
    const onWide = () => setWide(mq.matches);
    onWide();
    mq.addEventListener("change", onWide);
    return () => mq.removeEventListener("change", onWide);
  }, [menu, pathname, role]);

  useEffect(() => {
    setOpenGroup(platformGroupForPath(buildPlatformMenu(role), pathname));
  }, [pathname, role]);

  useEffect(() => {
    actionRef.current = undefined;
    setMeta({ title: platformTitleForPath(pathname) });
  }, [pathname, setMeta, actionRef]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia(ADMIN_MOBILE_TABBAR_MEDIA).matches) return;
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
    window.localStorage.setItem("psy-platform-sidebar", next ? "1" : "0");
    setCollapsed(next);
    setOpenGroup(next ? null : platformGroupForPath(menu, pathname));
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  const clinicLink = role === "super_admin" ? (
    <Link
      href="/admin"
      className={`mb-1 flex min-h-11 items-center overflow-hidden rounded-[var(--radius-control)] py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white ${
        collapsed ? "justify-center px-0" : "gap-2 px-3"
      }`}
    >
      <HiOutlineShieldCheck size={18} className="shrink-0" aria-hidden />
      {!collapsed ? <span>Painel clínico</span> : null}
    </Link>
  ) : null;

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-sans text-ink">
      <AdminDeskSidebar
        menu={menu}
        pathname={pathname}
        collapsed={collapsed}
        wide={wide}
        openGroup={openGroup}
        onToggleCollapsed={toggleCollapsed}
        onToggleGroup={toggleGroup}
        onCookiePreferences={openPreferences}
        profileName={profileName}
        profilePhoto={profilePhoto}
        profileEmail={user?.email}
        unread={0}
        notificationsHref={null}
        homeHref="/plataforma"
        profileHref="/admin/configuracoes#seguranca"
        brandSubtitle="Plataforma"
        sidebarTestId="platform-desk-sidebar"
        layoutGroupId="platform-sidebar"
        isNavCurrent={isPlatformNavCurrent}
        beforeLogout={clinicLink}
        onLogout={async () => {
          await logout();
          router.replace("/plataforma/login");
        }}
      />

      <MobileHeader title={mobileTitle} action={actionRef.current} />

      <PlatformMobileTabBar
        pathname={pathname}
        hidden={tabbarHidden}
        menu={menu}
        role={role}
        onCookiePreferences={openPreferences}
        onLogout={async () => {
          await logout();
          router.replace("/plataforma/login");
        }}
      />

      <div
        className={`pb-[calc(5.75rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-out desk:pb-8 ${sidebarMainPadding(collapsed, wide)}`}
      >
        <div className="mx-auto w-full min-w-0 max-w-[1200px] px-4 py-4 sm:px-5 sm:py-6 desk:py-8">
          <MfaEncouragementBanner />
          <AdminPageMotion routeKey={pathname}>{children}</AdminPageMotion>
        </div>
      </div>
    </div>
  );
}

export default function PlatformShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string | null;
}) {
  return (
    <AdminPageMetaProvider>
      <PlatformShellInner role={role ?? null}>{children}</PlatformShellInner>
    </AdminPageMetaProvider>
  );
}
