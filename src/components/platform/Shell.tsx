"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HiOutlineClipboardList, HiOutlineCreditCard, HiOutlineHome, HiOutlineLogout, HiOutlineMail, HiOutlineShieldCheck, HiOutlineUserGroup } from "react-icons/hi";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/lib/admin/auth-context";

const links = [
  { href: "/plataforma", label: "Indicadores", icon: HiOutlineHome },
  { href: "/plataforma/contas", label: "Contas", icon: HiOutlineUserGroup },
  { href: "/plataforma/planos", label: "Planos", icon: HiOutlineCreditCard },
  { href: "/plataforma/notificacoes", label: "Notificações", icon: HiOutlineMail },
  { href: "/plataforma/auditoria", label: "Auditoria", icon: HiOutlineClipboardList },
];

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink">
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
              <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm ${current ? "bg-white text-teal" : "text-white/80 hover:bg-white/10"}`}>
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/15 pt-4">
          <p className="truncate px-2 text-xs text-white/70">{user?.email}</p>
          <Link href="/admin" className="mt-3 flex items-center gap-2 px-2 text-sm text-white/80"><HiOutlineShieldCheck /> Painel clínico</Link>
          <button
            type="button"
            className="mt-3 flex items-center gap-2 px-2 text-sm text-white/80"
            onClick={async () => {
              await logout();
              router.replace("/plataforma/login");
            }}
          >
            <HiOutlineLogout /> Sair
          </button>
        </div>
      </aside>
      <div className="sticky top-0 z-20 flex gap-2 overflow-auto bg-footer px-3 py-3 text-sm text-white md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="shrink-0 rounded-md bg-white/10 px-3 py-2">{link.label}</Link>
        ))}
      </div>
      <div className="md:pl-64">
        <div className="mx-auto w-[min(94%,1100px)] py-8">{children}</div>
      </div>
    </div>
  );
}
