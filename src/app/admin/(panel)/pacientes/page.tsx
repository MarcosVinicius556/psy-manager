"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Drawer from "@/components/admin/Drawer";
import PatientForm from "@/components/admin/PatientForm";
import { Card, DataTable, Empty, PageTitle, Pill, Td, Th, fieldClass } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { labelPatientStatus } from "@/lib/admin/format";
import { maskPhone } from "@/lib/masks";

function PatientsContent() {
  const { patients, loading } = useClinic();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | "ativo" | "inativo">("todos");
  const creating = params.get("novo") === "1";
  const editId = params.get("edit");
  const editing = patients.find((patient) => patient.id === editId);
  const drawerOpen = creating || Boolean(editing);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesStatus = status === "todos" || patient.status === status;
      const phoneDigits = patient.telefone.replace(/\D/g, "");
      const termDigits = term.replace(/\D/g, "");
      const matchesQuery =
        !term ||
        patient.nome.toLowerCase().includes(term) ||
        patient.telefone.toLowerCase().includes(term) ||
        (termDigits.length > 0 && phoneDigits.includes(termDigits)) ||
        patient.email.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [patients, query, status]);

  function replaceQuery(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function closeDrawer() {
    replaceQuery({ novo: null, edit: null });
  }

  if (loading) return <p className="text-muted">Carregando pacientes...</p>;

  return (
    <div>
      <PageTitle
        title="Pacientes"
        subtitle="Cadastro e acompanhamento."
        action={
          <button type="button" className="btn-primary" onClick={() => replaceQuery({ novo: "1", edit: null })}>
            Novo paciente
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos"],
            ["ativo", "Ativos"],
            ["inativo", "Inativos"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={status === value ? "btn-chip-active" : "btn-chip"}
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
            placeholder="Buscar por nome, telefone ou e-mail"
            className={fieldClass}
          />
        </div>
        {filtered.length === 0 ? (
          <Empty>Nenhum paciente encontrado.</Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Telefone</Th>
                <Th>E-mail</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => (
                <tr key={patient.id} className="hover:bg-paper">
                  <Td>
                    <Link href={`/admin/pacientes/${patient.id}`} className="font-medium text-teal">
                      {patient.nome}
                    </Link>
                  </Td>
                  <Td>{maskPhone(patient.telefone) || "—"}</Td>
                  <Td>{patient.email || "—"}</Td>
                  <Td>
                    <Pill tone={patient.status === "ativo" ? "sage" : "muted"}>{labelPatientStatus(patient.status)}</Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/pacientes/${patient.id}`} className="btn-row">
                        Detalhes
                      </Link>
                      <button type="button" className="btn-text" onClick={() => replaceQuery({ edit: patient.id, novo: null })}>
                        Editar
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
      <Drawer open={drawerOpen} title={editing ? "Editar paciente" : "Novo paciente"} onClose={closeDrawer}>
        {drawerOpen && (
          <PatientForm key={editing?.id || "novo"} patient={editing} onSaved={closeDrawer} />
        )}
      </Drawer>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando pacientes...</p>}>
      <PatientsContent />
    </Suspense>
  );
}
