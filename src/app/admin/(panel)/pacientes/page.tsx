"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Drawer from "@/components/admin/Drawer";
import PatientForm from "@/components/admin/PatientForm";
import ListCard from "@/components/admin/mobile/ListCard";
import { ListSkeleton } from "@/components/admin/mobile/Skeleton";
import FloatingActionButton from "@/components/admin/mobile/FloatingActionButton";
import SegmentedControl from "@/components/admin/mobile/SegmentedControl";
import { Card, DataTable, Empty, MobileListGrid, PageTitle, Pill, ResponsiveTableWrap, Td, Th, fieldClass } from "@/components/admin/ui";
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

  if (loading) return <ListSkeleton rows={6} />;

  return (
    <div className="admin-fab-pad">
      <PageTitle
        title="Pacientes"
        subtitle="Cadastro e acompanhamento."
        action={
          <button type="button" className="btn-primary" onClick={() => replaceQuery({ novo: "1", edit: null })}>
            Novo paciente
          </button>
        }
      />
      <FloatingActionButton label="Novo paciente" onClick={() => replaceQuery({ novo: "1", edit: null })} />
      <div className="sticky top-14 z-10 mb-4 space-y-3 bg-paper/95 py-3 backdrop-blur-md md:static md:bg-transparent md:p-0">
        <SegmentedControl
          ariaLabel="Filtrar pacientes"
          layout="equal"
          value={status}
          onChange={setStatus}
          options={[
            { value: "todos", label: "Todos" },
            { value: "ativo", label: "Ativos" },
            { value: "inativo", label: "Inativos" },
          ]}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail"
          className={fieldClass}
          type="search"
          inputMode="search"
          autoComplete="off"
        />
      </div>
      <Card>
        {filtered.length === 0 ? (
          <Empty>Nenhum paciente encontrado.</Empty>
        ) : (
          <>
          <MobileListGrid>
            {filtered.map((patient) => {
              const contactLines = [maskPhone(patient.telefone), patient.email].filter(Boolean);
              return (
              <ListCard
                key={patient.id}
                href={`/admin/pacientes/${patient.id}`}
                title={patient.nome}
                subtitleLines={contactLines.length > 0 ? contactLines : ["Sem contato"]}
                meta={<Pill tone={patient.status === "ativo" ? "sage" : "muted"}>{labelPatientStatus(patient.status)}</Pill>}
              />
            );
            })}
          </MobileListGrid>
          <ResponsiveTableWrap>
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
          </ResponsiveTableWrap>
          </>
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
