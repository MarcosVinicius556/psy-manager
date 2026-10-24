"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

export type AdminPageMeta = {
  title: string;
  action?: ReactNode;
};

type AdminPageMetaContextValue = {
  /** Page title for the mobile header (stable state). */
  meta: AdminPageMeta;
  /** Latest page action slot; updated each render without forcing parent re-renders. */
  actionRef: MutableRefObject<ReactNode | undefined>;
  setTitle: (title: string) => void;
  setMeta: (patch: Partial<AdminPageMeta>) => void;
};

const defaultMeta: AdminPageMeta = { title: "Painel" };

const AdminPageMetaContext = createContext<AdminPageMetaContextValue | undefined>(undefined);

export function AdminPageMetaProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState(defaultMeta.title);
  const actionRef = useRef<ReactNode | undefined>(undefined);

  const setTitle = useCallback((next: string) => {
    setTitleState((current) => (current === next ? current : next));
  }, []);

  const setMeta = useCallback((patch: Partial<AdminPageMeta>) => {
    if (patch.title !== undefined) setTitle(patch.title);
    if ("action" in patch) actionRef.current = patch.action;
  }, [setTitle]);

  const meta = useMemo(() => ({ title }), [title]);
  const value = useMemo(() => ({ meta, actionRef, setTitle, setMeta }), [meta, setTitle, setMeta]);

  return <AdminPageMetaContext.Provider value={value}>{children}</AdminPageMetaContext.Provider>;
}

export function useOptionalAdminPageMeta() {
  return useContext(AdminPageMetaContext) ?? null;
}

export function useAdminPageMeta() {
  const ctx = useOptionalAdminPageMeta();
  if (!ctx) throw new Error("useAdminPageMeta deve ser usado dentro de AdminPageMetaProvider");
  return ctx;
}

export function useSetAdminPageMeta(meta: AdminPageMeta) {
  const ctx = useOptionalAdminPageMeta();
  if (ctx) {
    ctx.actionRef.current = meta.action;
  }
  useEffect(() => {
    if (!ctx) return;
    ctx.setTitle(meta.title);
  }, [ctx, meta.title]);
}
