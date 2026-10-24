"use client";

import { useEffect, useState } from "react";
import { Card, Empty, PageTitle } from "@/components/admin/ui";
import { DEFAULT_PLANS, formatPrice, type PlanDefinition } from "@/lib/saas/model";
import { loadRemotePlans, publishDefaultPlans, savePlan } from "@/lib/saas/platform-store";

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setPlans(await loadRemotePlans());
  }

  useEffect(() => {
    load().catch(() => setMessage("Não foi possível ler o catálogo.")).finally(() => setLoading(false));
  }, []);

  async function publish() {
    setMessage("");
    try {
      await publishDefaultPlans();
      await load();
      setMessage("Catálogo inicial publicado. Os preços continuam em branco.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível publicar.");
    }
  }

  async function save(plan: PlanDefinition, price: string) {
    const trimmed = price.trim();
    const precoCentavos = trimmed === "" ? null : Math.round(Number(trimmed.replace(",", ".")) * 100);
    if (trimmed !== "" && (!Number.isFinite(precoCentavos) || (precoCentavos ?? 0) < 0)) {
      setMessage("Informe um valor válido ou deixe em branco para manter “a definir”.");
      return;
    }
    try {
      await savePlan({ ...plan, precoCentavos });
      await load();
      setMessage("Plano atualizado. Nenhuma conta foi cobrada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  return (
    <div>
      <PageTitle title="Planos" subtitle="O catálogo começa sem preço. Publicar ou editar não cobra ninguém e não marca assinatura como paga." />
      {loading && <p className="text-muted">Carregando planos...</p>}
      {!loading && plans.length === 0 && (
        <Card>
          <p className="text-muted">Nenhum plano publicado. O rascunho local tem {DEFAULT_PLANS.map((plan) => plan.nome).join(" e ")}, ambos com valor a definir.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => void publish()}>Publicar catálogo inicial</button>
        </Card>
      )}
      <div className="grid gap-4">
        {plans.map((plan) => <PlanEditor key={plan.id} plan={plan} onSave={save} />)}
      </div>
      {message && <p className="mt-4 text-sm text-teal">{message}</p>}
      {!loading && plans.length === 0 && <div className="mt-4"><Empty>Enquanto o catálogo não estiver publicado, a página pública mostra os mesmos planos com valor a definir.</Empty></div>}
    </div>
  );
}

function PlanEditor({ plan, onSave }: { plan: PlanDefinition; onSave: (plan: PlanDefinition, price: string) => Promise<void> }) {
  const [price, setPrice] = useState(plan.precoCentavos == null ? "" : (plan.precoCentavos / 100).toFixed(2));
  const [nome, setNome] = useState(plan.nome);
  const [descricao, setDescricao] = useState(plan.descricao);
  const [disponivel, setDisponivel] = useState(plan.disponivel);
  return (
    <Card>
      <p className="text-sm text-muted">Hoje: {formatPrice(plan.precoCentavos)}</p>
      <div className="mt-3 grid gap-3">
        <input className="rounded-md border border-[#e2e8ea] px-3 py-2" value={nome} onChange={(event) => setNome(event.target.value)} aria-label="Nome do plano" />
        <textarea className="rounded-md border border-[#e2e8ea] px-3 py-2" value={descricao} onChange={(event) => setDescricao(event.target.value)} aria-label="Descrição" />
        <label className="text-sm">Preço em reais, vazio se ainda não definido
          <input className="mt-1 w-full rounded-md border border-[#e2e8ea] px-3 py-2" value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={disponivel} onChange={(event) => setDisponivel(event.target.checked)} /> Disponível para contratação</label>
        <button type="button" className="btn-primary justify-self-start" onClick={() => void onSave({ ...plan, nome, descricao, disponivel }, price)}>Salvar plano</button>
      </div>
    </Card>
  );
}
