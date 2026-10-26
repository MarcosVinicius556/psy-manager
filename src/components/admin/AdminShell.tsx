"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminPageMotion } from "@/components/admin/motion/AdminPageMotion";
import { AdminDeskSidebar, sidebarMainPadding } from "@/components/admin/desk-sidebar/AdminDeskSidebar";
import MobileHeader from "@/components/admin/mobile/MobileHeader";
import MobileTabBar from "@/components/admin/mobile/MobileTabBar";
import { AdminPageMetaProvider, useAdminPageMeta } from "@/lib/admin/page-meta-context";
import { isExpenseAlert } from "@/lib/admin/expenses";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { adminGroupForPath, adminTitleForPath, buildAdminMenu } from "@/lib/admin/admin-nav";
import { filterAdminNav } from "@/lib/team/admin-nav";
import { useWorkspace } from "@/lib/team/workspace-context";
import { useCookieConsent } from "@/components/legal/CookieConsentProvider";
import { ADMIN_MOBILE_TABBAR_MEDIA, isNarrowDeskViewport } from "@/lib/admin/layout-breakpoints";
import PwaBootstrap from "@/components/admin/PwaBootstrap";

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { meta, actionRef, setMeta } = useAdminPageMeta();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, role } = useAuth();
  const { workspace } = useWorkspace();
  const menu = filterAdminNav(buildAdminMenu(role), workspace);
  const { notifications, members, locationInvites, expenses } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const profileName = me?.nome || user?.displayName || user?.email || "Conta";
  const profilePhoto = me?.foto || user?.photoURL;
  const pendingInvites = locationInvites.filter((invite) => invite.inviteeUid === user?.uid && invite.status === "pendente").length;
  const unread = notifications.filter((item) => !item.lida).length + pendingInvites + expenses.filter((expense) => isExpenseAlert(expense)).length;
  const [collapsed, setCollapsed] = useState(false);
  const [wide, setWide] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [tabbarHidden, setTabbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const mobileTitle = meta.title !== "Painel" ? meta.title : adminTitleForPath(pathname);
  const { openPreferences } = useCookieConsent();

  useEffect(() => {
    const storedCollapsed = window.localStorage.getItem("psy-sidebar") === "1";
    const narrowDesk = isNarrowDeskViewport(window.innerWidth);
    setCollapsed(narrowDesk ? true : storedCollapsed);
    setOpenGroup(narrowDesk ? null : adminGroupForPath(menu, pathname));
    const mq = window.matchMedia("(min-width: 64rem)");
    const onWide = () => setWide(mq.matches);
    onWide();
    mq.addEventListener("change", onWide);
    return () => mq.removeEventListener("change", onWide);
  }, []);

  useEffect(() => {
    setOpenGroup(adminGroupForPath(buildAdminMenu(role), pathname));
  }, [pathname, role]);

  useEffect(() => {
    actionRef.current = undefined;
    setMeta({ title: adminTitleForPath(pathname) });
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
    window.localStorage.setItem("psy-sidebar", next ? "1" : "0");
    setCollapsed(next);
    setOpenGroup(next ? null : adminGroupForPath(menu, pathname));
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <PwaBootstrap />
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
        unread={unread}
        onLogout={async () => {
          await logout();
          router.replace("/admin/login");
        }}
      />

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
        className={`pb-[calc(5.75rem+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-out desk:pb-8 ${sidebarMainPadding(collapsed, wide)}`}
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-5 sm:py-6 desk:py-8">
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
