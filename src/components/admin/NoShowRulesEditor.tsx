"use client";

import Select from "@/components/admin/Select";
import { Field, fieldClass } from "@/components/admin/ui";
import {
  NO_SHOW_PERIOD_OPTIONS,
  summarizeNoShowRules,
  type NoShowChargeConfig,
  type NoShowRules,
} from "@/lib/admin/no-show-rules";

const KIND_OPTIONS = [
  { value: "percentual", label: "% da sessão" },
  { value: "fixo", label: "Valor fixo" },
];

function ChargeConfigFields({
  idPrefix,
  title,
  hint,
  config,
  onChange,
}: {
  idPrefix: string;
  title: string;
  hint: string;
  config: NoShowChargeConfig;
  onChange: (next: NoShowChargeConfig) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-md border border-[#e7eee8] bg-paper/60 p-4" data-tour={`${idPrefix}-regra`}>
      <legend className="px-1 text-sm font-semibold text-teal">{title}</legend>
      <p className="text-sm text-muted">{hint}</p>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={config.cobrar}
          onChange={(event) => onChange({ ...config, cobrar: event.target.checked })}
        />
        Cobrar esta falta
      </label>
      {config.cobrar ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Como cobrar">
            <Select
              value={config.tipo}
              onChange={(value) =>
                onChange({ ...config, tipo: value === "fixo" ? "fixo" : "percentual", valor: value === "fixo" ? 0 : 100 })
              }
              options={KIND_OPTIONS}
            />
          </Field>
          <Field label={config.tipo === "fixo" ? "Valor (R$)" : "Percentual (%)"}>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={String(config.valor).replace(".", ",")}
              onChange={(event) => {
                const raw = event.target.value.replace(/[^\d,]/g, "").replace(",", ".");
                const parsed = Number(raw);
                onChange({ ...config, valor: Number.isFinite(parsed) ? parsed : 0 });
              }}
              placeholder={config.tipo === "fixo" ? "0,00" : "100"}
            />
          </Field>
        </div>
      ) : null}
    </fieldset>
  );
}

export default function NoShowRulesEditor({
  rules,
  onChange,
  legado,
}: {
  rules: NoShowRules;
  onChange: (next: NoShowRules) => void;
  legado: boolean;
}) {
  const limite = rules.limiteJustificadas;
  return (
    <div className="grid gap-4 sm:col-span-2" data-tour="regras-falta">
      <div>
        <h3 className="text-lg font-medium text-teal">Regras de cobrança por falta</h3>
        <p className="mt-1 text-sm text-muted">
          Valem para todos os seus pacientes. Ao marcar &quot;Não compareceu&quot; no atendimento, o sistema aplica a regra e cria
          (ou não) a cobrança em Contas a receber. Você pode revisar, ajustar o valor ou dispensar a cobrança depois.
        </p>
        {legado ? (
          <p className="mt-2 text-sm text-accent">
            Você ainda usa a política antiga (só sugestão de cobrança). Salve as regras abaixo para ativar a aplicação automática.
          </p>
        ) : null}
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm" data-tour="regras-falta-automatico">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={rules.automatico}
          onChange={(event) => onChange({ ...rules, automatico: event.target.checked })}
        />
        Criar a cobrança automaticamente ao registrar a falta
      </label>
      <div className="grid gap-4 desk:grid-cols-2">
        <ChargeConfigFields
          idPrefix="sem-justificativa"
          title="Falta sem justificativa"
          hint="Paciente faltou sem avisar ou sem motivo aceito."
          config={rules.semJustificativa}
          onChange={(semJustificativa) => onChange({ ...rules, semJustificativa })}
        />
        <ChargeConfigFields
          idPrefix="com-justificativa"
          title="Falta justificada"
          hint="Paciente avisou com motivo aceito (atestado, imprevisto combinado etc.)."
          config={rules.comJustificativa}
          onChange={(comJustificativa) => onChange({ ...rules, comJustificativa })}
        />
      </div>
      <fieldset className="flex min-w-0 flex-col gap-3 rounded-md border border-[#e7eee8] bg-paper/60 p-4" data-tour="regras-falta-limite">
        <legend className="px-1 text-sm font-semibold text-teal">Limite de faltas justificadas</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={limite.ativo}
            onChange={(event) => onChange({ ...rules, limiteJustificadas: { ...limite, ativo: event.target.checked } })}
          />
          Depois de algumas faltas justificadas, passar a cobrar
        </label>
        {limite.ativo ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Faltas justificadas toleradas">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={String(limite.quantidade)}
                  onChange={(event) => {
                    const n = Number.parseInt(event.target.value.replace(/\D/g, "").slice(0, 2), 10);
                    onChange({ ...rules, limiteJustificadas: { ...limite, quantidade: Number.isFinite(n) ? n : 1 } });
                  }}
                />
              </Field>
              <Field label="No período de">
                <Select
                  value={String(limite.periodoDias)}
                  onChange={(value) => onChange({ ...rules, limiteJustificadas: { ...limite, periodoDias: Number(value) } })}
                  options={NO_SHOW_PERIOD_OPTIONS.map((days) => ({ value: String(days), label: `${days} dias` }))}
                />
              </Field>
            </div>
            <ChargeConfigFields
              idPrefix="limite"
              title={`A partir da ${limite.quantidade + 1}ª falta justificada`}
              hint="Contamos as faltas justificadas do mesmo paciente com você dentro do período."
              config={limite.cobranca}
              onChange={(cobranca) => onChange({ ...rules, limiteJustificadas: { ...limite, cobranca } })}
            />
          </>
        ) : null}
      </fieldset>
      <p className="text-sm text-muted" aria-live="polite">
        Resumo: {summarizeNoShowRules(rules)}
      </p>
    </div>
  );
}
