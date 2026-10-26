"use client";

import Link from "next/link";
import { BUILTIN_FORM_TEMPLATES } from "@/lib/admin/form-templates-builtin";
import { Card } from "@/components/admin/ui";

export default function FormulariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-teal">Formulários e anamnese</h1>
        <p className="mt-2 text-sm text-muted">
          Envie modelos por link público (sem login do paciente). As respostas ficam vinculadas à ficha e podem ser usadas no prontuário.
        </p>
      </div>
      <Card>
        <h2 className="mb-3 text-lg font-medium text-teal">Modelos incluídos</h2>
        <ul className="grid gap-3">
          {BUILTIN_FORM_TEMPLATES.map((item) => (
            <li key={item.id} className="rounded-surface border border-[var(--color-border-subtle)] p-3">
              <p className="font-medium text-ink">{item.nome}</p>
              <p className="text-sm text-muted">{item.descricao}</p>
              <p className="mt-1 text-xs text-muted">Versão {item.versao} · {item.campos.length} campos</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Para enviar, abra a ficha do paciente em Prontuário e use &quot;Formulário online&quot;. Modelos personalizados podem ser adicionados em versões futuras.
        </p>
        <Link href="/admin/pacientes" className="btn-text mt-3 inline-block">Ir para pacientes</Link>
      </Card>
    </div>
  );
}
