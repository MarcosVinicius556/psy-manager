"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AdminPageMeta = {
  title: string;
  action?: ReactNode;
};

type AdminPageMetaContextValue = {
  meta: AdminPageMeta;
  setMeta: (patch: Partial<AdminPageMeta>) => void;
};

const defaultMeta: AdminPageMeta = { title: "Painel" };

const AdminPageMetaContext = createContext<AdminPageMetaContextValue | undefined>(undefined);

export function AdminPageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<AdminPageMeta>(defaultMeta);
  const setMeta = useCallback((patch: Partial<AdminPageMeta>) => {
    setMetaState((current) => ({ ...current, ...patch }));
  }, []);
  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta]);
  return <AdminPageMetaContext.Provider value={value}>{children}</AdminPageMetaContext.Provider>;
}

export function useAdminPageMeta() {
  const ctx = useContext(AdminPageMetaContext);
  if (!ctx) throw new Error("useAdminPageMeta deve ser usado dentro de AdminPageMetaProvider");
  return ctx;
}

export function useSetAdminPageMeta(meta: AdminPageMeta) {
  const { setMeta } = useAdminPageMeta();
  useEffect(() => {
    setMeta({ title: meta.title, action: meta.action });
  }, [meta.action, meta.title, setMeta]);
}
