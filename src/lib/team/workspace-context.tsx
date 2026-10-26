"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/admin/auth-context";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { setTenantOwnerUid } from "./workspace-owner";
import type { WorkspaceContext } from "./types";

type WorkspaceState = {
  workspace: WorkspaceContext | null;
  loading: boolean;
  refreshClaims: () => Promise<void>;
};

const Ctx = createContext<WorkspaceState | undefined>(undefined);

const defaultWorkspace = (uid: string): WorkspaceContext => ({
  kind: "owner",
  tenantOwnerUid: uid,
  actorUid: uid,
  staffPerms: [],
  clinicId: null,
  clinicRole: null,
  isClinicalAllowed: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClaims = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    await auth.currentUser.getIdToken(true);
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setWorkspace(null);
      setTenantOwnerUid(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const headers = await authorizedHeaders();
        const response = await fetch("/api/team/workspace", { headers });
        if (!response.ok) {
          if (active) {
            const fallback = defaultWorkspace(user.uid);
            setWorkspace(fallback);
            setTenantOwnerUid(fallback.tenantOwnerUid);
          }
          return;
        }
        const data = (await response.json()) as { workspace: WorkspaceContext };
        if (!active) return;
        setWorkspace(data.workspace);
        setTenantOwnerUid(data.workspace.tenantOwnerUid);
      } catch {
        if (active) {
          const fallback = defaultWorkspace(user.uid);
          setWorkspace(fallback);
          setTenantOwnerUid(fallback.tenantOwnerUid);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo(
    () => ({
      workspace,
      loading,
      refreshClaims,
    }),
    [workspace, loading, refreshClaims]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace deve ser usado dentro de WorkspaceProvider.");
  return ctx;
}
