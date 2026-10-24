"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/admin/auth-context";
import { ClinicProvider } from "@/lib/admin/clinic-context";
import AdminShell from "@/components/admin/AdminShell";
import { BlockedAccount } from "@/components/admin/AccountStatus";
import { SaasProvider, useSaas } from "@/lib/saas/context";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!configured || !user)) router.replace("/admin/login");
  }, [configured, loading, router, user]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-paper text-muted">Carregando painel...</div>;
  }

  return (
    <SaasProvider>
      <ClinicProvider>
        <AdminShell>
          <ClinicGate>{children}</ClinicGate>
        </AdminShell>
      </ClinicProvider>
    </SaasProvider>
  );
}

function ClinicGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { access, account } = useSaas();
  const allowed = pathname.startsWith("/admin/assinatura") || pathname.startsWith("/admin/configuracoes");
  if (access.mode === "blocked" && !allowed && account) return <BlockedAccount account={account} />;
  return children;
}
