"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BrandLogo from "@/components/BrandLogo";
import { usePatientAuth } from "@/lib/patient/auth-context";

const NAV = [
  { href: "/paciente", label: "Início" },
  { href: "/paciente/sessoes", label: "Sessões" },
  { href: "/paciente/diario", label: "Diário" },
  { href: "/paciente/escalas", label: "Escalas" },
  { href: "/paciente/configuracoes", label: "Menu" },
] as const;

export default function PatientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, profile } = usePatientAuth();
  const publicRoute = pathname.startsWith("/paciente/login") || pathname.startsWith("/paciente/convite") || pathname.startsWith("/paciente/auth");

  useEffect(() => {
    if (loading || publicRoute) return;
    if (!user) router.replace("/paciente/login");
    else if (profile && profile.linked && !profile.active) router.replace("/paciente/login?motivo=portal_desativado");
  }, [loading, user, profile, publicRoute, router]);

  if (publicRoute) {
    return <div className="min-h-dvh bg-paper text-ink">{children}</div>;
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-muted">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <BrandLogo className="h-8" />
          <div className="text-right text-sm">
            <p className="font-medium text-teal">{profile?.patientNome || "Portal do paciente"}</p>
            <p className="text-muted">{profile?.profissionalNome}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4 pb-24">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border-subtle)] bg-white px-2 py-2"
        aria-label="Navegação do portal"
      >
        <ul className="mx-auto flex max-w-3xl justify-between gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`block rounded-control px-2 py-2 text-center text-xs font-medium ${
                    active ? "bg-teal/10 text-teal" : "text-muted hover:text-teal"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
