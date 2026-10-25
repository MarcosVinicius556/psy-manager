"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineX,
} from "react-icons/hi";
import BrandLogo from "@/components/BrandLogo";
import MfaEncouragementBanner from "@/components/platform/MfaEncouragementBanner";
import MobileHeader from "@/components/admin/mobile/MobileHeader";
import { useAuth } from "@/lib/admin/auth-context";
import { AdminPageMetaProvider, useAdminPageMeta } from "@/lib/admin/page-meta-context";

const allLinks = [
  { href: "/plataforma", label: "Indicadores", icon: HiOutlineHome, short: "Painel" },
  { href: "/plataforma/contas", label: "Contas", icon: HiOutlineUserGroup, short: "Contas" },
  { href: "/plataforma/planos", label: "Planos", icon: HiOutlineCreditCard, short: "Planos" },
  { href: "/plataforma/suporte", label: "Suporte", icon: HiOutlineChatAlt2, short: "Suporte" },
  { href: "/plataforma/notificacoes", label: "Notificações", icon: HiOutlineMail, short: "Avisos" },
  { href: "/plataforma/auditoria", label: "Auditoria", icon: HiOutlineClipboardList, short: "Auditoria" },
];

function titleForPath(pathname: string) {
  if (pathname === "/plataforma") return "Indicadores";
  if (pathname.startsWith("/plataforma/contas/")) return "Conta";
  if (pathname.startsWith("/plataforma/contas")) return "Contas";
  if (pathname.startsWith("/plataforma/planos")) return "Planos";
  if (pathname.startsWith("/plataforma/suporte")) return "Suporte";
  if (pathname.startsWith("/plataforma/notificacoes")) return "Notificações";
  if (pathname.startsWith("/plataforma/auditoria")) return "Auditoria";
  return "Plataforma";
}

function platformLinks(role: string | null | undefined) {
  if (role === "support") return allLinks.filter((link) => link.href.startsWith("/plataforma/suporte"));
  return allLinks;
}

function PlatformShellInner({ children, role }: { children: React.ReactNode; role: string | null | undefined }) {
  const links = platformLinks(role);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { meta, actionRef, setMeta } = useAdminPageMeta();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabbarHidden, setTabbarHidden] = useState(false);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const lastScrollY = useRef(0);
  const mobileTitle = meta.title !== "Painel" ? meta.title : titleForPath(pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    actionRef.current = undefined;
    setMeta({ title: titleForPath(pathname) });
  }, [pathname, setMeta, actionRef]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 767px)").matches) return;
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

  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-sans text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-footer px-4 py-6 text-white md:flex">
        <Link href="/plataforma" className="px-1" aria-label="Psy Manager">
          <span className="block rounded-md bg-white px-2 py-1.5">
            <BrandLogo variant="lockup" height={44} />
          </span>
          <span className="mt-2 block text-[0.68rem] uppercase tracking-[0.16em] text-leaf">Plataforma</span>
        </Link>
        <nav className="mt-8 grid gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const current = link.href === "/plataforma" ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${current ? "bg-white text-teal" : "text-white/80 hover:bg-white/10"}`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/15 pt-4">
          <p className="truncate px-2 text-xs text-white/70">{user?.email}</p>
          <Link href="/admin" className="mt-3 flex min-h-11 items-center gap-2 px-2 text-sm text-white/80 hover:text-white">
            <HiOutlineShieldCheck /> Painel clínico
          </Link>
          <button
            type="button"
            className="mt-1 flex min-h-11 items-center gap-2 px-2 text-sm text-white/80 hover:text-white"
            onClick={async () => {
              await logout();
              router.replace("/plataforma/login");
            }}
          >
            <HiOutlineLogout /> Sair
          </button>
        </div>
      </aside>

      <MobileHeader title={mobileTitle} action={actionRef.current} onOpenMenu={() => setMobileOpen(true)} />

      {mobileOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-ink/40 md:hidden" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />
      )}
      <div
        id="platform-mobile-nav"
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Menu da plataforma"
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-footer px-4 text-white transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link href="/plataforma" className="rounded-md bg-white px-2 py-1.5" onClick={() => setMobileOpen(false)}>
            <BrandLogo variant="lockup" height={36} />
          </Link>
          <button
            ref={mobileCloseRef}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md border border-white/20 text-white"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          >
            <HiOutlineX size={22} />
          </button>
        </div>
        <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-leaf">Plataforma</p>
        <nav className="mt-6 grid gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const current = link.href === "/plataforma" ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-sm ${current ? "bg-white text-teal" : "text-white/85"}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/15 pt-4">
          <p className="truncate px-2 text-xs text-white/70">{user?.email}</p>
          <Link href="/admin" className="mt-3 flex min-h-11 items-center gap-2 px-2 text-sm text-white/80" onClick={() => setMobileOpen(false)}>
            <HiOutlineShieldCheck /> Painel clínico
          </Link>
          <button
            type="button"
            className="mt-1 flex min-h-11 w-full items-center gap-2 px-2 text-sm text-white/80"
            onClick={async () => {
              setMobileOpen(false);
              await logout();
              router.replace("/plataforma/login");
            }}
          >
            <HiOutlineLogout /> Sair
          </button>
        </div>
      </div>

      <nav
        className={`admin-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-footer transition-transform duration-300 md:hidden ${
          tabbarHidden ? "translate-y-full" : "translate-y-0"
        }`}
        aria-label="Plataforma"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={`grid grid-cols-${Math.min(links.length, 6)}`} style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
          {links.map((link) => {
            const Icon = link.icon;
            const current = link.href === "/plataforma" ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[0.62rem] font-medium leading-tight ${current ? "text-leaf" : "text-white/80"}`}
              >
                <Icon size={20} />
                <span className="max-w-full truncate">{link.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64">
        <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 py-4 sm:px-5 md:py-8">
          <MfaEncouragementBanner />
          {children}
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
