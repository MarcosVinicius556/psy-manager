"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform/Shell";
import { useAuth } from "@/lib/admin/auth-context";

export default function PlatformPanelLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!configured || !user) router.replace("/plataforma/login");
    else if (role && role !== "super_admin") router.replace("/admin");
  }, [configured, loading, role, router, user]);

  if (loading || !user || role !== "super_admin") {
    return <div className="grid min-h-screen place-items-center bg-paper text-muted">Verificando o acesso da plataforma...</div>;
  }

  return <PlatformShell>{children}</PlatformShell>;
}
