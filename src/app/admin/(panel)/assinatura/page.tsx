"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, Empty, PageTitle, Pill } from "@/components/admin/ui";
import ConsultantActions from "@/components/ConsultantActions";
import { cancelOwnPlan, markInboxRead, saveProfile } from "@/lib/saas/account-store";
import { useSaas } from "@/lib/saas/context";
import { daysRemaining, formatPrice, periodLabel, STATUS_LABEL } from "@/lib/saas/model";
import { listBillingEvents, type BillingEntry } from "@/lib/saas/platform-store";

export default function SubscriptionPage() {
  const { account, plans, inbox, access, refresh } = useSaas();
  const [events, setEvents] = useState<BillingEntry[]>([]);
  const [busy, setBusy] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!account) return;
    listBillingEvents(account.uid).then(setEvents).catch((error) => console.error(error));
  }, [account]);

  if (!account) return null;
  const status = account.subscriptionStatus && account.subscriptionStatus in STATUS_LABEL
    ? STATUS_LABEL[account.subscriptionStatus as keyof typeof STATUS_LABEL]
    : "Ainda sem situação comercial";
  const current = plans.find((plan) => plan.id === account.planId);
  const end = account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleString("pt-BR") : "";

  async function cancel() {
    setBusy("cancelar");
    try {
      await cancelOwnPlan(account!);
      await refresh();
      setConfirmCancel(false);
      toast.success("Avaliação ou cortesia cancelada. Os dados do consultório permanecem.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar.");
    } finally {
      setBusy("");
    }
  }

  async function savePreference(patch: { operationalEmail?: boolean; productEmail?: boolean }) {
    try {
      await saveProfile(account!.uid, patch);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a preferência.");
    }
  }

  return (
    <div>
      <PageTitle title="Assinatura" subtitle="Situação da conta, avaliação e contratação. Pagamento só existe quando um provedor confirmar." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Situação</p>
          <p className="mt-2 text-2xl text-teal">{status}</p>
          <div className="mt-3"><Pill tone={access.mode === "full" ? "sage" : "accent"}>{access.mode === "full" ? "Lançamentos liberados" : access.mode === "blocked" ? "Conta pausada" : "Só consulta"}</Pill></div>
        </Card>
        <Card>
          <p className="text-sm text-muted">Plano em uso</p>
          <p className="mt-2 text-2xl text-teal">{current?.nome || account.planId || "Não definido"}</p>
          <p className="mt-2 text-sm text-muted">{current ? `${formatPrice(current.precoCentavos)} ${periodLabel(current.periodicidade)}` : "O catálogo ainda não tem preço para este plano."}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Avaliação</p>
          {account.subscriptionStatus === "trial_ativo" ? (
            <>
              <p className="mt-2 text-2xl text-teal">{daysRemaining(account.trialEndsAtMillis, Date.now())} dias</p>
              <p className="mt-2 text-sm text-muted">Termina em {end}. Sem renovação automática.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{end ? `Término registrado em ${end}.` : "Esta conta não está em um trial novo."}</p>
          )}
        </Card>
      </div>

      {account.checkoutStatus === "aguardando_provedor" && (
        <p className="mt-4 rounded-md border border-[#d7e0d8] bg-white px-4 py-3 text-sm text-muted">
          Há uma solicitação de contratação do plano {account.checkoutPlanId || "contínuo"} desde {account.checkoutRequestedAt ? new Date(account.checkoutRequestedAt).toLocaleString("pt-BR") : "agora"}. O provedor de pagamento não está configurado, então isso não é uma assinatura ativa.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-2xl text-teal">Plano contínuo</h2>
          <p className="mt-2 text-sm text-muted">O valor pago se fecha com um consultor, pelo WhatsApp ou e-mail. Não há checkout nesta tela e o sistema não guarda cartão.</p>
          <div className="mt-4">
            <ConsultantActions />
          </div>
          {(account.subscriptionStatus === "trial_ativo" || account.subscriptionStatus === "cortesia") && !confirmCancel && (
            <button type="button" className="btn-text mt-4" onClick={() => setConfirmCancel(true)}>Cancelar avaliação ou cortesia</button>
          )}
          {confirmCancel && (
            <div className="mt-4 rounded-md bg-paper p-4 text-sm">
              <p>O cancelamento interrompe novos lançamentos. Pacientes, agenda e financeiro permanecem. Não há estorno porque não existe cobrança registrada.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-danger" disabled={busy === "cancelar"} onClick={() => void cancel()}>Confirmar cancelamento</button>
                <button type="button" className="btn-text" onClick={() => setConfirmCancel(false)}>Voltar</button>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-2xl text-teal">Comunicação</h2>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={account.productEmail} onChange={(event) => void savePreference({ productEmail: event.target.checked })} />
            <span>Receber e-mails sobre novidades do produto, quando o envio estiver configurado.</span>
          </label>
          <p className="mt-4 text-sm text-muted">Avisos operacionais da conta, como o fim da avaliação, continuam previstos. Se o e-mail não estiver configurado no servidor, o aviso fica só aqui dentro.</p>
          <div className="mt-4 grid gap-2">
            {inbox.length === 0 && <Empty>Nenhum aviso da plataforma.</Empty>}
            {inbox.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-md bg-paper px-3 py-3 text-left text-sm"
                onClick={() => {
                  if (!item.lida) void markInboxRead(account.uid, item.id).then(() => refresh());
                }}
              >
                <span className="font-semibold text-ink">{item.titulo}</span>
                <span className="mt-1 block text-muted">{item.corpo}</span>
                <span className="mt-1 block text-xs text-muted">E-mail: {emailLabel(item.emailResult)} · {item.lida ? "lido" : "não lido"}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-2xl text-teal">Histórico comercial</h2>
        <div className="mt-4 grid gap-2">
          {events.length === 0 && <Empty>Nenhum evento de contratação ou ajuste.</Empty>}
          {events.map((event) => (
            <p key={event.id} className="rounded-md bg-paper px-3 py-3 text-sm">
              <span className="font-semibold">{event.summary || event.tipo}</span>
              <span className="mt-1 block text-muted">{event.at ? new Date(event.at).toLocaleString("pt-BR") : ""} · {event.resultado === "pago" ? "pago" : "sem pagamento confirmado"}</span>
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}

function emailLabel(result: string) {
  if (result === "enviado") return "enviado";
  if (result === "provedor_nao_configurado") return "provedor não configurado";
  if (result === "preferencia_desligada") return "preferência desligada";
  if (result === "pendente") return "ainda não confirmado";
  return result || "não confirmado";
}
