"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Card } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { computeNoShowCharge, formatPoliticaFalta } from "@/lib/admin/no-show-policy";
import { formatMoney } from "@/lib/admin/format";
import type { Appointment } from "@/lib/admin/types";

export default function NoShowChargeSuggestion({ appointment }: { appointment: Appointment }) {
  const { members, payments, createNoShowCharge } = useClinic();
  const [saving, setSaving] = useState(false);
  const member = members.find((item) => item.id === appointment.professionalId);
  if (!member) return null;

  const suggestion = computeNoShowCharge(appointment, member);
  if (!suggestion) return null;

  const existing = payments.find(
    (payment) =>
      payment.appointmentId === appointment.id &&
      payment.status !== "pago" &&
      payment.descricao.toLowerCase().includes("falta")
  );
  if (existing) return null;

  return (
    <Card className="mb-4">
      <h2 className="text-2xl font-medium text-teal">Cobrança por falta</h2>
      <p className="mt-2 text-sm text-muted">{formatPoliticaFalta(suggestion.policy)}</p>
      <p className="mt-3 text-ink">
        Valor sugerido: <strong>{formatMoney(suggestion.valor)}</strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary min-h-11"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await createNoShowCharge(appointment.id);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar a cobrança.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Criando..." : "Criar cobrança"}
        </button>
      </div>
    </Card>
  );
}
