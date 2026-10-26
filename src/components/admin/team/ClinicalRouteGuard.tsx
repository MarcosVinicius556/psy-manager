"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isClinicalRoute } from "@/lib/team/admin-nav";
import { useWorkspace } from "@/lib/team/workspace-context";

export function ClinicalRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, loading } = useWorkspace();

  useEffect(() => {
    if (loading || !workspace) return;
    if (!workspace.isClinicalAllowed && isClinicalRoute(pathname)) {
      router.replace("/admin");
    }
  }, [loading, pathname, router, workspace]);

  if (!loading && workspace && !workspace.isClinicalAllowed && isClinicalRoute(pathname)) {
    return <div className="p-6 text-muted">Esta área não está disponível para o seu perfil.</div>;
  }

  return children;
}
