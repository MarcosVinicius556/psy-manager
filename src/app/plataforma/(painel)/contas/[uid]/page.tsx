"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Empty, PageTitle, fieldClass } from "@/components/admin/ui";
import { readAccount } from "@/lib/saas/account-store";
import { ACCOUNT_LABEL, applyAdminAction, STATUS_LABEL, type AccountRecord, type AdminAction } from "@/lib/saas/model";
import {
  commitAdminAction,
  confirmSubscriptionPixPayment,
  listAccountInbox,
  listAudit,
  listBillingEvents,
  type AuditEntry,
  type BillingEntry,
} from "@/lib/saas/platform-store";
import type { InboxItem } from "@/lib/saas/account-store";

const actions: { id: AdminAction; label: string; consequence: string }[] = [
  { id: "alterar_plano", label: "Alterar plano", consequence: "Troca o plano registrado. Não confirma pagamento, não cobra e não marca a assinatura como paga." },
  { id: "estender_trial", label: "Estender trial", consequence: "Empurra a data de término e reabre os lançamentos se a conta estiver só com o trial vencido ou cancelado. Não cria cobrança." },
  { id: "encerrar_trial", label: "Encerrar trial", consequence: "Encerra a avaliação agora. Novos lançamentos param. Os dados clínicos permanecem." },
  { id: "conceder_cortesia", label: "Conceder cortesia", consequence: "Libera o painel por decisão administrativa. Isso não é pagamento recebido nem assinatura paga." },
  { id: "encerrar_cortesia", label: "Encerrar cortesia", consequence: "Remove o acesso cortesia. A conta e os dados continuam cadastrados." },
  { id: "suspender", label: "Suspender conta", consequence: "Pausa o uso do painel sem apagar a assinatura e sem excluir pacientes ou prontuários." },
  { id: "reativar", label: "Reativar conta", consequence: "Devolve a conta suspensa ou desativada. A situação comercial anterior é mantida." },
  { id: "desativar", label: "Desativar conta", consequence: "Desativa o acesso. Não é exclusão definitiva e não apaga dados clínicos." },
];

export default function AccountDetailPage() {
  const params = useParams<{ uid: string }>();
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [events, setEvents] = useState<BillingEntry[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [planId, setPlanId] = useState("consultorio");
  const [days, setDays] = useState(15);
  const [pending, setPending] = useState<AdminAction | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmPixBusy, setConfirmPixBusy] = useState(false);

  async function load() {
    const [nextAccount, nextEvents, nextAudit, nextInbox] = await Promise.all([
      readAccount(params.uid),
      listBillingEvents(params.uid),
      listAudit(params.uid),
      listAccountInbox(params.uid),
    ]);
    setAccount(nextAccount.exists ? nextAccount.account : null);
    setPlanId(nextAccount.account.planId && nextAccount.account.planId !== "legado" ? nextAccount.account.planId : "consultorio");
    setEvents(nextEvents);
    setAudit(nextAudit);
    setInbox(nextInbox);
  }

  useEffect(() => {
    load().catch(() => setMessage("Não foi possível abrir esta conta.")).finally(() => setLoading(false));
  }, [params.uid]);

  async function run() {
    if (!account || !pending) return;
    setMessage("");
    try {
      await commitAdminAction(account, pending, { planId, days });
      setPending(null);
      await load();
      setMessage("Alteração registrada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
    }
  }

  if (loading) return <p className="text-muted">Carregando conta...</p>;
  if (!account) return <Empty>Conta não encontrada.</Empty>;
  const chosen = actions.find((item) => item.id === pending);

  return (
    <div>
      <PageTitle title={account.nome || account.email} subtitle={account.clinicName || "Consultório sem nome"} action={<Link href="/plataforma/contas" className="btn-text">Voltar</Link>} />
      <div className="grid gap-3 md:grid-cols-3">
        <Card><p className="text-sm text-muted">E-mail</p><p className="mt-2">{account.email}</p></Card>
        <Card><p className="text-sm text-muted">Assinatura</p><p className="mt-2">{account.subscriptionStatus ? STATUS_LABEL[account.subscriptionStatus] : "—"}</p></Card>
        <Card><p className="text-sm text-muted">Conta</p><p className="mt-2">{account.accountStatus ? ACCOUNT_LABEL[account.accountStatus] : "—"}</p></Card>
      </div>
      {account.checkoutStatus === "aguardando_confirmacao_pix" && (
        <Card className="mt-4">
          <h2 className="text-2xl text-teal">Pix aguardando confirmação</h2>
          <p className="mt-2 text-sm text-muted">
            Plano solicitado: <strong>{account.checkoutPlanId}</strong>
            {account.pixTxid ? ` · TxID ${account.pixTxid}` : ""}
            {account.paidUntilMillis ? ` · Pago até ${new Date(account.paidUntilMillis).toLocaleString("pt-BR")}` : ""}
          </p>
          <p className="mt-2 text-sm">Confirme somente após validar o Pix no banco. Isso ativa a assinatura e estende o período pago.</p>
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={confirmPixBusy}
            onClick={() => {
              setConfirmPixBusy(true);
              void confirmSubscriptionPixPayment(account.uid)
                .then(() => load().then(() => setMessage("Pagamento Pix confirmado.")))
                .catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao confirmar."))
                .finally(() => setConfirmPixBusy(false));
            }}
          >
            Confirmar pagamento Pix
          </button>
        </Card>
      )}
      <Card className="mt-4">
        <h2 className="text-2xl text-teal">Ações</h2>
        <p className="mt-2 text-sm text-muted">Nenhuma ação apaga prontuário. Alterar plano não dispara cobrança.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button key={action.id} type="button" className="btn-chip" onClick={() => { setPending(action.id); setMessage(""); }}>{action.label}</button>
          ))}
        </div>
        {pending && (
          <div className="mt-4 grid max-w-xl gap-3 rounded-md bg-paper p-4">
            <p className="text-sm">{chosen?.consequence}</p>
            {(pending === "alterar_plano" || pending === "conceder_cortesia") && (
              <label className="text-sm">Plano
                <select className={`${fieldClass} mt-1.5`} value={planId} onChange={(event) => setPlanId(event.target.value)}>
                  <option value="avaliacao">Avaliação</option>
                  <option value="consultorio">Consultório</option>
                </select>
              </label>
            )}
            {pending === "estender_trial" && (
              <label className="text-sm">Dias
                <input type="number" min={1} max={90} className={`${fieldClass} mt-1.5`} value={days} onChange={(event) => setDays(Number(event.target.value))} />
              </label>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-danger" onClick={() => void run()}>Confirmar</button>
              <button type="button" className="btn-text" onClick={() => setPending(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {message && <p className="mt-3 text-sm text-teal">{message}</p>}
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl text-teal">Eventos comerciais</h2>
          <div className="mt-3 grid gap-2">
            {events.length === 0 && <Empty>Nenhum evento.</Empty>}
            {events.map((event) => <p key={event.id} className="rounded-md bg-paper px-3 py-3 text-sm">{event.summary || event.tipo}<span className="mt-1 block text-muted">{event.at ? new Date(event.at).toLocaleString("pt-BR") : ""}</span></p>)}
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl text-teal">Auditoria desta conta</h2>
          <div className="mt-3 grid gap-2">
            {audit.length === 0 && <Empty>Nenhuma intervenção registrada.</Empty>}
            {audit.map((item) => <p key={item.id} className="rounded-md bg-paper px-3 py-3 text-sm">{item.summary}<span className="mt-1 block text-muted">{item.actorEmail} · {item.at ? new Date(item.at).toLocaleString("pt-BR") : ""}</span></p>)}
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="text-2xl text-teal">Avisos recebidos</h2>
        <div className="mt-3 grid gap-2">
          {inbox.length === 0 && <Empty>Nenhum aviso interno.</Empty>}
          {inbox.map((item) => <p key={item.id} className="rounded-md bg-paper px-3 py-3 text-sm">{item.titulo}<span className="mt-1 block text-muted">{item.corpo}</span></p>)}
        </div>
      </Card>
      <p className="mt-4 text-sm text-muted">Prévia da regra, sem gravar: {preview(account, pending, planId, days)}</p>
    </div>
  );
}

function preview(account: AccountRecord, action: AdminAction | null, planId: string, days: number) {
  if (!action) return "escolha uma ação para ver a consequência.";
  try {
    return applyAdminAction(account, action, { planId, days, now: Date.now() }).summary;
  } catch (error) {
    return error instanceof Error ? error.message : "Ação indisponível para esta conta.";
  }
}
