"use client";

import Link from "next/link";
import { HiOutlineCalendar, HiOutlineCash, HiOutlineUserAdd, HiOutlineX } from "react-icons/hi";

const actions = [
  { href: "/admin/agenda?novo=1", label: "Nova sessão", icon: HiOutlineCalendar, match: "/admin/agenda" },
  { href: "/admin/pacientes?novo=1", label: "Novo paciente", icon: HiOutlineUserAdd, match: "/admin/pacientes" },
  { href: "/admin/financeiro?novo=1", label: "Registrar pagamento", icon: HiOutlineCash, match: "/admin/financeiro" },
] as const;

function orderedActions(pathname: string) {
  const index = actions.findIndex((action) => pathname.startsWith(action.match));
  if (index <= 0) return actions;
  return [actions[index], ...actions.filter((_, i) => i !== index)];
}

export default function QuickCreateSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  if (!open) return null;

  const list = orderedActions(pathname);

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-ink/35 md:hidden" aria-label="Fechar ações rápidas" onClick={onClose} />
      <div
        className="fixed inset-x-3 z-50 rounded-[1.25rem] border border-[#e7eee8] bg-white p-3 shadow-[0_20px_60px_rgba(36,48,40,0.18)] md:hidden"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-modal="true"
        aria-label="Ações rápidas"
      >
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-sm font-semibold text-teal">Criar</p>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-muted" aria-label="Fechar" onClick={onClose}>
            <HiOutlineX size={20} />
          </button>
        </div>
        <ul className="grid gap-1">
          {list.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  onClick={onClose}
                  className="motion-press flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-sky-soft/80"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-soft text-teal">
                    <Icon size={18} aria-hidden />
                  </span>
                  {action.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
