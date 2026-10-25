import type { SupportTicketStatus } from "@/lib/support/types";
import { statusLabel } from "@/lib/support/labels";

const tone: Partial<Record<SupportTicketStatus, string>> = {
  aberto: "bg-sky-soft text-teal",
  em_analise: "bg-amber-50 text-amber-900",
  aguardando_informacoes: "bg-orange-50 text-orange-900",
  em_desenvolvimento: "bg-violet-50 text-violet-900",
  aguardando_aprovacao: "bg-indigo-50 text-indigo-900",
  reprovado: "bg-red-50 text-red-800",
  resolvido: "bg-emerald-50 text-emerald-900",
  encerrado: "bg-paper text-muted",
};

export default function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <span className={`inline-flex rounded-[var(--radius-control)] px-2 py-0.5 text-xs font-medium ${tone[status] ?? "bg-paper text-muted"}`}>
      {statusLabel(status)}
    </span>
  );
}
