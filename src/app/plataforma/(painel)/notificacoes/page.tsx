"use client";

import { useEffect, useMemo, useState } from "react";
import StackedRow from "@/components/admin/mobile/StackedRow";
import { Card, Empty, MobileStackedList, PageTitle, fieldClass } from "@/components/admin/ui";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { deliverAdminEmail } from "@/lib/saas/email-client";
import { matchesAccountFilter, type AccountRecord } from "@/lib/saas/model";
import { finishPlatformMessage, listManagedAccounts, listPlatformMessages, sendPlatformMessage, setInboxEmailResult } from "@/lib/saas/platform-store";

const audiences = [
  ["todos", "Todas as contas"],
  ["trials_ativos", "Trials ativos"],
  ["trials_expirados", "Trials expirados"],
  ["pagantes", "Assinaturas pagas"],
  ["pagamento", "Contratação sem pagamento"],
  ["canceladas", "Canceladas"],
  ["suspensas", "Suspensas ou desativadas"],
] as const;

export default function NotificationsPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listPlatformMessages>>>([]);
  const [audience, setAudience] = useState<(typeof audiences)[number][0]>("trials_ativos");
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [categoria, setCategoria] = useState<"operacional" | "produto">("operacional");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const [nextAccounts, nextHistory] = await Promise.all([listManagedAccounts(), listPlatformMessages()]);
    setAccounts(nextAccounts);
    setHistory(nextHistory);
  }

  useEffect(() => {
    load().catch(() => setMessage("Não foi possível carregar as contas."));
  }, []);

  const targets = useMemo(() => accounts.filter((account) => matchesAccountFilter(account, audience, Date.now())), [accounts, audience]);

  async function send() {
    if (titulo.trim().length < 3 || corpo.trim().length < 3) {
      setMessage("Escreva um título e uma mensagem.");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      const created = await sendPlatformMessage({ accounts: targets, titulo, corpo, categoria });
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      let enviados = 0;
      let falhas = 0;
      if (!token) throw new Error("Sessão expirada.");
      for (let index = 0; index < targets.length; index += 20) {
        const slice = targets.slice(index, index + 20).filter((account) => categoria === "operacional" || account.productEmail);
        const skipped = targets.slice(index, index + 20).filter((account) => categoria === "produto" && !account.productEmail);
        for (const account of skipped) {
          await setInboxEmailResult(account.uid, created.id, "preferencia_desligada");
          falhas += 1;
        }
        if (slice.length === 0) continue;
        const results = await deliverAdminEmail(token, {
          recipients: slice.map((account) => ({ to: account.email, accountUid: account.uid })),
          subject: titulo.trim(),
          text: corpo.trim(),
          categoria,
        });
        for (const result of results) {
          const account = slice.find((item) => item.email === result.to);
          if (!account) continue;
          await setInboxEmailResult(account.uid, created.id, result.delivered ? "enviado" : result.reason);
          if (result.delivered) enviados += 1;
          else falhas += 1;
        }
      }
      await finishPlatformMessage(created.id, enviados, falhas);
      setConfirming(false);
      setTitulo("");
      setCorpo("");
      await load();
      setMessage(enviados > 0 ? `Aviso interno registrado. ${enviados} e-mail(s) confirmado(s) pelo provedor.` : "Aviso interno registrado. Nenhum e-mail foi confirmado pelo provedor.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageTitle title="Notificações" subtitle="O aviso interno é gravado na hora. O e-mail só conta como enviado quando o provedor aceita." />
      <Card>
        <div className="grid gap-3">
          <label className="text-sm">Público
            <select className={`${fieldClass} mt-1.5`} value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)}>
              {audiences.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <p className="text-sm text-muted">{targets.length} conta(s) neste recorte.</p>
          <label className="text-sm">Tipo
            <select className={`${fieldClass} mt-1.5`} value={categoria} onChange={(event) => setCategoria(event.target.value as typeof categoria)}>
              <option value="operacional">Operacional</option>
              <option value="produto">Produto</option>
            </select>
          </label>
          <label className="text-sm">Título
            <input className={`${fieldClass} mt-1.5`} value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={140} placeholder="título do aviso" />
          </label>
          <label className="text-sm">Mensagem
            <textarea className={`${fieldClass} mt-1.5 min-h-32`} value={corpo} onChange={(event) => setCorpo(event.target.value)} maxLength={4000} placeholder="mensagem para as contas selecionadas" />
          </label>
          <div className="rounded-md bg-paper p-4 text-sm">
            <p className="font-semibold">Prévia</p>
            <p className="mt-2">{titulo || "Título"}</p>
            <p className="mt-1 text-muted">{corpo || "A mensagem aparece aqui antes do envio."}</p>
          </div>
          {!confirming ? (
            <button type="button" className="btn-primary justify-self-start" onClick={() => setConfirming(true)} disabled={targets.length === 0}>Revisar envio</button>
          ) : (
            <div className="rounded-md bg-paper p-4 text-sm">
              <p>Isso grava um aviso para {targets.length} contas. E-mails de produto respeitam quem desligou a preferência. Operacionais tentam o provedor configurado.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-danger" disabled={sending} onClick={() => void send()}>{sending ? "Enviando..." : "Confirmar envio"}</button>
                <button type="button" className="btn-text" onClick={() => setConfirming(false)}>Voltar</button>
              </div>
            </div>
          )}
          {message && <p className="text-sm text-teal">{message}</p>}
        </div>
      </Card>
      <Card className="mt-4">
        <h2 className="text-2xl text-teal">Histórico</h2>
        <MobileStackedList className="mt-3">
          {history.length === 0 && <Empty>Nenhum comunicado registrado.</Empty>}
          {history.map((item) => (
            <StackedRow
              key={item.id}
              primary={item.titulo}
              secondary={item.corpo}
              hint={`${item.audiencia} contas · ${item.enviados} e-mails confirmados · ${item.falhas} sem confirmação · ${item.status}`}
            />
          ))}
        </MobileStackedList>
      </Card>
    </div>
  );
}
