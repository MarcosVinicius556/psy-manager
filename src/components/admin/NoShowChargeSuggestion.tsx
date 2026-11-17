"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { Card, Field, Pill, fieldClass } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { evaluateNoShow, NO_SHOW_RULE_LABELS, type NoShowRuleCode } from "@/lib/admin/no-show-rules";
import { formatMoney, moneyInput, parseMoney } from "@/lib/admin/format";
import type { Appointment } from "@/lib/admin/types";

function ruleLabel(code: string) {
  return NO_SHOW_RULE_LABELS[code as NoShowRuleCode] ?? "Regra de falta";
}

/**
 * Card do atendimento com falta: mostra a regra aplicada, a cobrança criada (ou
 * por que não foi criada) e permite criar, ajustar ou dispensar a cobrança.
 */
export default function NoShowChargeSuggestion({ appointment }: { appointment: Appointment }) {
  const { members, payments, appointments, createNoShowCharge, waiveNoShowCharge } = useClinic();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [valorManual, setValorManual] = useState("");
  const member = members.find((item) => item.id === appointment.professionalId);
  if (!member) return null;

  const decision = evaluateNoShow({
    appointment,
    justificada: appointment.faltaJustificada === true,
    member,
    history: appointments,
  });
  const existing = payments.find(
    (payment) =>
      payment.appointmentId === appointment.id &&
      (Boolean(payment.regraFalta) || payment.descricao.toLowerCase().includes("falta"))
  );
  const outcome = appointment.faltaCobranca;
  const waived = !existing && outcome?.situacao === "dispensada";

  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-4">
      <div data-tour="falta-cobranca">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-medium text-teal">Cobrança por falta</h2>
          {appointment.faltaJustificada === true ? <Pill tone="sage">Justificada</Pill> : null}
          {appointment.faltaJustificada === false ? <Pill tone="accent">Sem justificativa</Pill> : null}
        </div>

        {existing ? (
          <div className="mt-3 grid gap-1 text-sm">
            <p className="text-ink">
              Cobrança criada: <strong>{formatMoney(existing.valor)}</strong>{" "}
              <span className="text-muted">({existing.status === "pago" ? "paga" : "em aberto"})</span>
            </p>
            <p className="text-muted">
              Regra aplicada: {existing.regraFalta?.descricao || outcome?.descricao || "Cobrança de falta criada antes das regras."}
            </p>
          </div>
        ) : waived ? (
          <p className="mt-3 text-sm text-muted">Cobrança dispensada manualmente. Você ainda pode cobrar, se mudar de ideia.</p>
        ) : outcome?.situacao === "sem_cobranca" || (!decision.cobrar && !outcome) ? (
          <p className="mt-3 text-sm text-muted">
            Regra aplicada: {outcome?.descricao || decision.descricao}. Nenhuma cobrança foi criada.
          </p>
        ) : (
          <div className="mt-3 grid gap-1 text-sm">
            <p className="text-muted">Regra: {decision.descricao}</p>
            <p className="text-ink">
              Valor sugerido: <strong>{formatMoney(decision.valor)}</strong>
            </p>
          </div>
        )}

        {editing ? (
          <form
            className="mt-4 grid gap-3 sm:max-w-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => createNoShowCharge(appointment.id, { valor: parseMoney(valorManual) }));
            }}
          >
            <Field label="Valor da cobrança (R$)">
              <input
                className={fieldClass}
                inputMode="decimal"
                value={valorManual}
                onChange={(event) => setValorManual(event.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary min-h-11" disabled={saving}>
                {saving ? "Criando..." : "Criar cobrança"}
              </button>
              <button type="button" className="btn-text min-h-11" onClick={() => setEditing(false)}>
                Voltar
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {existing ? (
              <>
                <Link href="/admin/financeiro" className="btn-text min-h-11">
                  Ver no financeiro
                </Link>
                {existing.status !== "pago" ? (
                  <button
                    type="button"
                    className="btn-danger min-h-11"
                    disabled={saving}
                    onClick={() => void run(() => waiveNoShowCharge(appointment.id))}
                  >
                    {saving ? "Salvando..." : "Dispensar cobrança"}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                {decision.cobrar && !waived ? (
                  <button
                    type="button"
                    className="btn-primary min-h-11"
                    disabled={saving}
                    onClick={() => void run(() => createNoShowCharge(appointment.id))}
                  >
                    {saving ? "Criando..." : `Cobrar ${formatMoney(decision.valor)}`}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-text min-h-11"
                  onClick={() => {
                    setValorManual(moneyInput(decision.valor || decision.base));
                    setEditing(true);
                  }}
                >
                  {decision.cobrar && !waived ? "Cobrar outro valor" : "Cobrar mesmo assim"}
                </button>
                {decision.cobrar && !waived && outcome?.situacao !== "dispensada" ? (
                  <button
                    type="button"
                    className="btn-text min-h-11"
                    disabled={saving}
                    onClick={() => void run(() => waiveNoShowCharge(appointment.id))}
                  >
                    Não cobrar
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          {outcome?.manual ? "Decisão ajustada manualmente. " : ""}
          {ruleLabel(outcome?.codigo || decision.codigo)} · as regras ficam em{" "}
          <Link href="/admin/configuracoes" className="underline">
            Configurações › Valores da consulta
          </Link>
          .
        </p>
      </div>
    </Card>
  );
}
