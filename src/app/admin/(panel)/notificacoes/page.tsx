"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import StackedRow from "@/components/admin/mobile/StackedRow";
import { Card, DataTable, Empty, PageTitle, ResponsiveTableWrap, Td, Th, fieldClass } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { canSettleExpense, dueLabel, isDueSoon, isExpenseOverdue, isSharedExpense, paidShareCount } from "@/lib/admin/expenses";
import { formatDate, formatMoney } from "@/lib/admin/format";
import type { Expense, LocationInvite } from "@/lib/admin/types";

export default function NotificationsPage() {
  const { notifications, payments, expenses, locationInvites, members, loading, patientName, answerPayment, answerLocationInvite, payExpense } = useClinic();
  const { user } = useAuth();
  const me = members.find((member) => member.uid === user?.uid);
  const [view, setView] = useState<"todas" | "aguardando" | "respondidas">("todas");
  const [query, setQuery] = useState("");
  const [answering, setAnswering] = useState<string | null>(null);
  const incoming = locationInvites.filter((invite) => invite.inviteeUid === user?.uid);
  const overdueExpenses = expenses.filter((expense) => isExpenseOverdue(expense));
  const dueExpenses = expenses.filter((expense) => isDueSoon(expense));
  const ordered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...notifications]
      .filter((notification) => {
        if (view === "aguardando" && notification.lida) return false;
        if (view === "respondidas" && !notification.lida) return false;
        if (!term) return true;
        const payment = payments.find((item) => item.id === notification.paymentId);
        return [patientName(notification.patientId), payment?.descricao || ""].join(" ").toLowerCase().includes(term);
      })
      .sort((a, b) => Number(a.lida) - Number(b.lida) || b.createdAt.localeCompare(a.createdAt));
  }, [notifications, patientName, payments, query, view]);

  async function reply(invite: LocationInvite, status: "aceito" | "recusado") {
    setAnswering(invite.id);
    try {
      await answerLocationInvite(invite, status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível responder o convite.");
    } finally {
      setAnswering(null);
    }
  }

  if (loading) return <p className="text-muted">Carregando notificações...</p>;

  return (
    <div>
      <PageTitle
        title="Notificações"
        subtitle="Convites, vencimentos de despesas e confirmações de pagamento."
      />
      {(
        [
          ["Em atraso", overdueExpenses],
          ["Perto do vencimento", dueExpenses],
        ] as [string, Expense[]][]
      ).map(([title, items]) =>
        items.length === 0 ? null : (
          <Card key={title} className="mb-6">
            <h2 className="mb-3 font-medium">{title}</h2>
            <div className="grid gap-3">
              {items.map((expense) => (
                <div key={expense.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
                  <div>
                    <p className="font-medium">{expense.descricao}</p>
                    <p className="text-sm text-muted">
                      {dueLabel(expense.vencimento)} · {formatDate(expense.vencimento)} · {formatMoney(expense.valor)}
                      {isSharedExpense(expense) ? ` · compartilhada · ${paidShareCount(expense)}/${expense.shares.length}` : " · individual"}
                      {expense.tipo === "parcelada" ? ` · ${expense.parcelasRestantes} restante${expense.parcelasRestantes === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  {canSettleExpense(expense, { memberId: me?.id, uid: user?.uid }) && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => payExpense(expense.id).catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível registrar o pagamento."))}
                    >
                      {expense.tipo === "parcelada" ? "Pagar parcela" : isSharedExpense(expense) ? "Pagar minha parte" : "Marcar como paga"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )
      )}
      {incoming.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-medium">Convites de local</h2>
          <div className="grid gap-3">
            {incoming.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
                <div>
                  <p className="font-medium">{invite.locationNome}</p>
                  <p className="text-sm text-muted">
                    {invite.inviterNome} convidou você para compartilhar este local, a agenda e as despesas.
                  </p>
                </div>
                {invite.status === "pendente" ? (
                  <div className="flex gap-2">
                    <button type="button" className="btn-primary" disabled={answering === invite.id} onClick={() => reply(invite, "aceito")}>
                      Aceitar
                    </button>
                    <button type="button" className="btn-danger" disabled={answering === invite.id} onClick={() => reply(invite, "recusado")}>
                      Recusar
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-muted">{invite.status === "aceito" ? "Aceito" : "Recusado"}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["todas", "Todas"],
            ["aguardando", "Aguardando"],
            ["respondidas", "Respondidas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            className={view === value ? "btn-chip-active" : "btn-chip"}
          >
            {label}
          </button>
        ))}
      </div>
      <Card>
        <div className="mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por paciente ou lançamento"
            className={fieldClass}
          />
        </div>
        {ordered.length === 0 ? (
          <Empty>{notifications.length === 0 ? "Nenhum pagamento aguardando confirmação." : "Nenhuma notificação neste filtro."}</Empty>
        ) : (
          <>
          <div className="admin-mobile-only min-w-0" data-mobile-list>
            {ordered.map((notification) => {
              const payment = payments.find((item) => item.id === notification.paymentId);
              return (
                <StackedRow
                  key={notification.id}
                  primary={patientName(notification.patientId)}
                  secondary={payment ? `${payment.descricao} · vence ${formatDate(payment.dueDate)}` : "Lançamento não encontrado"}
                  status={<span className="text-xs text-muted">{formatDate(notification.date)}</span>}
                />
              );
            })}
          </div>
          <ResponsiveTableWrap>
          <DataTable>
            <thead>
              <tr>
                <Th>Paciente</Th>
                <Th>Lançamento</Th>
                <Th>Vencimento</Th>
                <Th>Gerada em</Th>
                <Th className="text-right">Situação</Th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((notification) => {
                const payment = payments.find((item) => item.id === notification.paymentId);
                return (
                  <tr key={notification.id} className="hover:bg-paper">
                    <Td className="font-medium text-teal">{patientName(notification.patientId)}</Td>
                    <Td>{payment ? `${payment.descricao} · ${formatMoney(payment.valor)}` : "Lançamento não encontrado"}</Td>
                    <Td>{payment ? formatDate(payment.dueDate) : "—"}</Td>
                    <Td>{formatDate(notification.date)}</Td>
                    <Td>
                      {notification.lida ? (
                        <p className="text-right font-medium">
                          {notification.resposta === "pago" ? "Confirmado como pago." : "Marcado como não pago."}
                        </p>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button type="button" className="btn-row" onClick={() => answerPayment(notification, "pago")}>
                            Foi pago
                          </button>
                          <button type="button" className="btn-danger" onClick={() => answerPayment(notification, "nao_pago")}>
                            Não foi pago
                          </button>
                          <Link href="/admin/financeiro" className="btn-row">
                            Ver lançamento
                          </Link>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          </ResponsiveTableWrap>
          </>
        )}
      </Card>
    </div>
  );
}
