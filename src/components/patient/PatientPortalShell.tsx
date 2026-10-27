"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BrandLogo from "@/components/BrandLogo";
import { PatientPortalThemeProvider } from "@/components/patient/PatientPortalTheme";
import { usePatientAuth } from "@/lib/patient/auth-context";

const NAV = [
  { href: "/paciente", label: "Início" },
  { href: "/paciente/tarefas", label: "Tarefas" },
  { href: "/paciente/documentos", label: "Documentos" },
  { href: "/paciente/mural", label: "Mensagens" },
  { href: "/paciente/configuracoes", label: "Menu" },
] as const;

export default function PatientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, profile } = usePatientAuth();
  const publicRoute =
    pathname.startsWith("/paciente/login") ||
    pathname.startsWith("/paciente/cadastro") ||
    pathname.startsWith("/paciente/convite") ||
    pathname.startsWith("/paciente/auth");

  useEffect(() => {
    if (loading || publicRoute || !user) return;
    if (
      profile &&
      profile.registered &&
      !profile.profileComplete &&
      !pathname.startsWith("/paciente/onboarding") &&
      !pathname.startsWith("/paciente/auth")
    ) {
      router.replace("/paciente/onboarding");
    }
  }, [loading, user, profile, publicRoute, pathname, router]);

  useEffect(() => {
    if (loading || publicRoute) return;
    if (!user) router.replace("/paciente/login");
  }, [loading, user, publicRoute, router]);

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

  const greetingName = profile?.patientNome?.split(" ")[0] || "Olá";

  return (
    <PatientPortalThemeProvider>
      <div className="min-h-dvh bg-paper text-ink">
        <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 py-3 patient-header">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <BrandLogo className="h-8" />
            <div className="text-right text-sm">
              <p className="font-medium text-teal">Olá, {greetingName}</p>
              {profile?.active && profile.profissionalNome ? (
                <p className="text-muted">Conexão ativa com {profile.profissionalNome}</p>
              ) : (
                <p className="text-muted">Portal do paciente</p>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-4 pb-24">{children}</main>
        <nav
          className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border-subtle)] bg-white px-2 py-2 patient-nav"
          aria-label="Navegação do portal"
        >
          <ul className="mx-auto flex max-w-3xl justify-between gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/paciente" && pathname.startsWith(item.href));
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    className={`block rounded-control px-1 py-2 text-center text-[11px] font-medium leading-tight sm:text-xs ${
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
    </PatientPortalThemeProvider>
  );
}
