"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PlatformShell from "@/components/platform/Shell";
import { useAuth } from "@/lib/admin/auth-context";

function platformAccessAllowed(role: string | null | undefined, pathname: string) {
  if (role === "super_admin") return true;
  if (role === "support") return pathname.startsWith("/plataforma/suporte");
  return false;
}

export default function PlatformPanelLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!configured || !user) router.replace("/plataforma/login");
    else if (role === "support" && !pathname.startsWith("/plataforma/suporte")) {
      router.replace("/plataforma/suporte");
    } else if (role && role !== "super_admin" && role !== "support") router.replace("/admin");
  }, [configured, loading, pathname, role, router, user]);

  if (loading || !user || !platformAccessAllowed(role, pathname)) {
    return <div className="grid min-h-screen place-items-center bg-paper text-muted">Verificando o acesso da plataforma...</div>;
  }

  return <PlatformShell role={role}>{children}</PlatformShell>;
}
