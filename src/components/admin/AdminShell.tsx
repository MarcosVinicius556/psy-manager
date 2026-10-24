"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HiOutlineBell, HiOutlineBriefcase, HiOutlineCalendar, HiOutlineCash, HiOutlineChartBar, HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineClipboardList, HiOutlineCog, HiOutlineCreditCard, HiOutlineCurrencyDollar, HiOutlineDocumentText, HiOutlineHome, HiOutlineLogout, HiOutlineOfficeBuilding, HiOutlineShieldCheck, HiOutlineUserAdd, HiOutlineUsers } from "react-icons/hi";
import { EmailBanner, OnboardingCard, TrialBanner } from "./AccountStatus";
import BrandLogo from "@/components/BrandLogo";
import Avatar from "./Avatar";
import { isExpenseAlert } from "@/lib/admin/expenses";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { HiOutlineBuildingOffice } from "react-icons/hi2";

type NavIcon = typeof HiOutlineHome;

type NavLinkItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

type NavGroupItem = {
  label: string;
  icon: NavIcon;
  children: NavLinkItem[];
};

type NavEntry = NavLinkItem | NavGroupItem;

const items: NavEntry[] = [
  { href: "/admin", label: "Início", icon: HiOutlineHome },
  {
    label: "Clínica",
    icon: HiOutlineBuildingOffice,
    children: [
      { href: "/admin/agenda", label: "Agenda", icon: HiOutlineCalendar },
      { href: "/admin/pacientes", label: "Pacientes", icon: HiOutlineUsers },
      { href: "/admin/locais", label: "Locais", icon: HiOutlineOfficeBuilding },
      { href: "/admin/pacotes", label: "Pacotes", icon: HiOutlineClipboardList },
    ],
  },
  {
    label: "Financeiro",
    icon: HiOutlineCash,
    children: [
      { href: "/admin/financeiro", label: "Contas a receber", icon: HiOutlineCash },
      { href: "/admin/despesas", label: "Contas a pagar", icon: HiOutlineCurrencyDollar },
    ],
  },
  {
    label: "Operacional",
    icon: HiOutlineBriefcase,
    children: [
      { href: "/admin/operacional/contrato", label: "Modelo de contrato", icon: HiOutlineDocumentText },
      { href: "/admin/operacional/relatorios", label: "Gerador de relatórios", icon: HiOutlineChartBar },
    ],
  },
  { href: "/admin/assinatura", label: "Assinatura", icon: HiOutlineCreditCard },
  { href: "/admin/notificacoes", label: "Notificações", icon: HiOutlineBell },
  { href: "/admin/configuracoes", label: "Configurações", icon: HiOutlineCog },
];

function isGroup(entry: NavEntry): entry is NavGroupItem {
  return "children" in entry;
}

function isCurrent(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function groupForPath(menu: NavEntry[], pathname: string) {
  const match = menu.find((entry) => isGroup(entry) && entry.children.some((child) => isCurrent(child.href, pathname)));
  return match && isGroup(match) ? match.label : null;
}

function linkClass(current: boolean, collapsed: boolean, nested = false) {
  return `flex items-center overflow-hidden rounded-md border text-sm font-medium transition-[background-color,border-color,color,padding,gap] duration-300 ${
    collapsed ? "justify-center px-0 py-3" : nested ? "gap-3 py-2.5 pl-9 pr-3" : "gap-3 px-3 py-3"
  } ${
    current
      ? "border-white bg-white text-teal hover:bg-transparent hover:text-white"
      : "border-transparent text-white/80 hover:border-white hover:bg-transparent hover:text-white"
  }`;
}

function chipClass(current: boolean) {
  return `shrink-0 rounded-md border px-3 py-2 text-sm transition-colors duration-300 ${
    current ? "border-white bg-white text-teal hover:bg-transparent hover:text-white" : "border-transparent bg-white/10 hover:border-white hover:bg-transparent"
  }`;
}

function FadeLabel({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-out ${
        show ? "max-w-[12rem] opacity-100" : "max-w-0 opacity-0"
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function NavAnchor({ item, collapsed, pathname, unread }: { item: NavLinkItem; collapsed: boolean; pathname: string; unread: number }) {
  const Icon = item.icon;
  const current = isCurrent(item.href, pathname);
  return (
    <Link href={item.href} title={collapsed ? item.label : undefined} className={linkClass(current, collapsed)}>
      <span className="relative shrink-0">
        <Icon size={20} />
        {item.href === "/admin/notificacoes" && unread > 0 && (
          <span
            className={`absolute -right-1 -top-1 h-2 w-2 bg-accent transition-opacity duration-300 ${collapsed ? "opacity-100" : "opacity-0"}`}
            style={{ borderRadius: "50%" }}
          />
        )}
      </span>
      <FadeLabel show={!collapsed} className="flex-1">
        {item.label}
      </FadeLabel>
      <FadeLabel show={!collapsed && item.href === "/admin/notificacoes" && unread > 0}>
        <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-white">{unread}</span>
      </FadeLabel>
    </Link>
  );
}

function NavGroup({
  item,
  collapsed,
  pathname,
  variant,
  open,
  onToggle,
}: {
  item: NavGroupItem;
  collapsed: boolean;
  pathname: string;
  variant: "desktop" | "mobile";
  open: boolean;
  onToggle: () => void;
}) {
  const groupActive = item.children.some((child) => isCurrent(child.href, pathname));
  const [box, setBox] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  const flyoutOpen = collapsed && open;

  useEffect(() => {
    setMounted(true);
  }, []);

  function placeFlyout() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.top, left: rect.right + 8 });
  }

  useEffect(() => {
    if (!collapsed) return;
    if (open) placeFlyout();
  }, [collapsed, open]);

  useEffect(() => {
    if (!flyoutOpen) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || flyoutRef.current?.contains(target)) return;
      onToggle();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && open) onToggle();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", placeFlyout);
    window.addEventListener("scroll", placeFlyout, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", placeFlyout);
      window.removeEventListener("scroll", placeFlyout, true);
    };
  }, [flyoutOpen, open, onToggle]);

  if (variant === "mobile") {
    return (
      <>
        <button type="button" aria-expanded={open} className={chipClass(groupActive && !open)} onClick={onToggle}>
          {item.label}
        </button>
        <span
          className={`grid min-w-0 transition-[grid-template-columns] duration-300 ease-out ${
            open ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
          }`}
        >
          <span className="flex min-w-0 gap-2 overflow-hidden">
            {item.children.map((child) => (
              <Link key={child.href} href={child.href} className={chipClass(isCurrent(child.href, pathname))}>
                {child.label}
              </Link>
            ))}
          </span>
        </span>
      </>
    );
  }

  const highlighted = collapsed ? groupActive : groupActive && !open;

  return (
    <div ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
        className={`w-full ${linkClass(highlighted, collapsed)}`}
        onClick={() => {
          if (collapsed) placeFlyout();
          onToggle();
        }}
      >
        <Icon size={20} className="shrink-0" />
        <FadeLabel show={!collapsed} className="flex-1 text-left">
          {item.label}
        </FadeLabel>
        <HiOutlineChevronDown
          size={16}
          className={`shrink-0 transition-[transform,opacity,width] duration-300 ${
            collapsed ? "w-0 opacity-0" : "opacity-100"
          } ${open && !collapsed ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          !collapsed && open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 flex flex-col gap-1">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link key={child.href} href={child.href} className={linkClass(isCurrent(child.href, pathname), false, true)}>
                  <ChildIcon size={18} />
                  <span className="flex-1">{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {mounted &&
        collapsed &&
        createPortal(
          <div
            ref={flyoutRef}
            className={`fixed z-50 w-56 rounded-md border border-white/20 bg-teal p-1 shadow-lg transition-[opacity,transform] duration-200 ease-out ${
              flyoutOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-1 opacity-0"
            }`}
            style={{ top: box.top, left: box.left }}
          >
            <p className="px-3 pb-1 pt-2 text-[0.68rem] uppercase tracking-[0.16em] text-leaf">{item.label}</p>
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link key={child.href} href={child.href} className={linkClass(isCurrent(child.href, pathname), false)}>
                  <ChildIcon size={18} />
                  <span className="flex-1">{child.label}</span>
                </Link>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, role } = useAuth();
  const menu: NavEntry[] = [
    ...items.slice(0, -1),
    ...(role === "super_admin"
      ? [
          { href: "/admin/usuarios", label: "Usuários", icon: HiOutlineUserAdd } satisfies NavLinkItem,
          { href: "/plataforma", label: "Plataforma", icon: HiOutlineShieldCheck } satisfies NavLinkItem,
        ]
      : []),
    items[items.length - 1],
  ];
  const { notifications, members, locationInvites, expenses } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const profileName = me?.nome || user?.displayName || user?.email || "Conta";
  const profilePhoto = me?.foto || user?.photoURL;
  const pendingInvites = locationInvites.filter((invite) => invite.inviteeUid === user?.uid && invite.status === "pendente").length;
  const unread = notifications.filter((item) => !item.lida).length + pendingInvites + expenses.filter((expense) => isExpenseAlert(expense)).length;
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("psy-sidebar") === "1");
    setOpenGroup(groupForPath(menu, pathname));
  }, []);

  useEffect(() => {
    setOpenGroup(groupForPath(menu, pathname));
  }, [pathname]);

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem("psy-sidebar", next ? "1" : "0");
    setCollapsed(next);
    setOpenGroup(next ? null : groupForPath(menu, pathname));
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden bg-teal pb-16 pt-6 text-white transition-[width,padding] duration-300 ease-out md:flex ${
          collapsed ? "w-[4.75rem] px-2" : "w-72 px-4"
        }`}
      >
        <div className={`flex shrink-0 gap-2 transition-[justify-content] duration-300 ${collapsed ? "flex-col items-center" : "items-center justify-between"}`}>
          <Link
            href="/admin"
            aria-label="Psy Manager"
            className={`flex min-w-0 items-center overflow-hidden ${collapsed ? "justify-center" : "rounded-md bg-white px-2 py-1.5"}`}
          >
            <BrandLogo variant={collapsed ? "mark" : "lockup"} height={collapsed ? 34 : 44} />
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={toggleCollapsed}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-transparent text-white/80 transition-colors duration-300 hover:border-white hover:text-white"
          >
            {collapsed ? <HiOutlineChevronRight size={20} /> : <HiOutlineChevronLeft size={20} />}
          </button>
        </div>
        <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {menu.map((entry) =>
            isGroup(entry) ? (
              <NavGroup
                key={entry.label}
                item={entry}
                collapsed={collapsed}
                pathname={pathname}
                variant="desktop"
                open={openGroup === entry.label}
                onToggle={() => toggleGroup(entry.label)}
              />
            ) : (
              <NavAnchor key={entry.href} item={entry} collapsed={collapsed} pathname={pathname} unread={unread} />
            )
          )}
        </nav>
        <div className="shrink-0 border-t border-white/15 pt-4">
          <Link
            href="/admin/configuracoes"
            title={collapsed ? profileName : undefined}
            className={`flex items-center overflow-hidden rounded-md py-2 transition-[gap,padding] duration-300 hover:bg-white/10 ${collapsed ? "justify-center" : "gap-3 px-2"}`}
          >
            <Avatar name={profileName} src={profilePhoto} size={40} light />
            <span className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[12rem] opacity-100"}`}>
              <span className="block truncate text-sm font-medium">{profileName}</span>
              <span className="block truncate text-xs text-white/70">{user?.email}</span>
            </span>
          </Link>
          <button
            type="button"
            title={collapsed ? "Sair" : undefined}
            className={`mt-3 flex w-full items-center overflow-hidden rounded-md border border-transparent py-2 text-sm text-white/80 transition-[color,border-color,padding,gap] duration-300 hover:border-white hover:bg-transparent hover:text-white ${
              collapsed ? "justify-center px-0" : "gap-2 px-3"
            }`}
            onClick={async () => {
              await logout();
              router.replace("/admin/login");
            }}
          >
            <HiOutlineLogout size={18} className="shrink-0" />
            <FadeLabel show={!collapsed}>Sair</FadeLabel>
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-20 flex gap-2 overflow-auto bg-teal px-3 py-3 text-white md:hidden">
        {menu.map((entry) =>
          isGroup(entry) ? (
            <NavGroup
              key={entry.label}
              item={entry}
              collapsed={false}
              pathname={pathname}
              variant="mobile"
              open={openGroup === entry.label}
              onToggle={() => toggleGroup(entry.label)}
            />
          ) : (
            <Link key={entry.href} href={entry.href} className={chipClass(isCurrent(entry.href, pathname))}>
              {entry.label}
              {entry.href === "/admin/notificacoes" && unread > 0 ? ` (${unread})` : ""}
            </Link>
          )
        )}
        <button
          type="button"
          className="shrink-0 rounded-md border border-transparent bg-white/10 px-3 py-2 text-sm transition-colors duration-300 hover:border-white hover:bg-transparent"
          onClick={async () => {
            await logout();
            router.replace("/admin/login");
          }}
        >
          Sair
        </button>
      </div>

      <div className={`transition-[padding] duration-300 ease-out ${collapsed ? "md:pl-[4.75rem]" : "md:pl-72"}`}>
        <div className="mx-auto w-[min(94%,1200px)] py-8 md:py-10">
          <EmailBanner />
          <TrialBanner />
          <OnboardingCard />
          {children}
        </div>
      </div>
    </div>
  );
}
