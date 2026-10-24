"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Drawer from "@/components/admin/Drawer";
import LocationForm from "@/components/admin/LocationForm";
import LocationMenu from "@/components/admin/LocationMenu";
import { Card, DataTable, Empty, PageTitle, Td, Th, fieldClass } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { locationPeople } from "@/lib/admin/workplaces";
import type { CareLocation } from "@/lib/admin/types";

export default function LocationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locations, members, locationInvites, loading, deleteLocation } = useClinic();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CareLocation | null>(null);
  const [sharing, setSharing] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return locations;
    return locations.filter((location) => {
      const people = locationPeople(location, members, locationInvites).join(" ");
      return [location.nome, location.endereco, people].join(" ").toLowerCase().includes(term);
    });
  }, [locationInvites, locations, members, query]);
  function creatorName(uid: string) {
    return (
      members.find((member) => member.uid === uid)?.nome ||
      locationInvites.find((invite) => invite.ownerUid === uid)?.inviterNome ||
      "quem criou"
    );
  }

  if (loading) return <p className="text-muted">Carregando locais...</p>;

  return (
    <div>
      <PageTitle
        title="Locais de atendimento"
        subtitle="Cada local tem os profissionais vinculados e a agenda formada pelos horários que eles marcam."
        action={
          <button type="button" className="btn-primary" onClick={() => { setEditing(null); setSharing(false); setCreating(true); }}>
            Novo local
          </button>
        }
      />
      <Card>
        <div className="mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, endereço ou profissional"
            className={fieldClass}
          />
        </div>
        {filtered.length === 0 ? (
          <Empty>
            {locations.length === 0
              ? "Nenhum local cadastrado. Cadastre o consultório para começar a agenda compartilhada."
              : "Nenhum local neste filtro."}
          </Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Local</Th>
                <Th>Endereço</Th>
                <Th>Profissionais</Th>
                <Th>Criado por</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((location) => {
                const owner = location.createdByUid === user?.uid;
                const people = locationPeople(location, members, locationInvites).join(", ");
                return (
                  <tr key={location.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/locais/${location.id}`} className="font-medium text-teal">
                        {location.nome}
                      </Link>
                    </Td>
                    <Td>{location.endereco || "—"}</Td>
                    <Td>{people || "Nenhum profissional vinculado"}</Td>
                    <Td>{creatorName(location.createdByUid)}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        {owner && (
                          <button
                            type="button"
                            className="btn-row"
                            onClick={() => {
                              setCreating(false);
                              setSharing(true);
                              setEditing(location);
                            }}
                          >
                            Compartilhar
                          </button>
                        )}
                        {owner && (
                          <button
                            type="button"
                            className="btn-row"
                            onClick={() => {
                              setCreating(false);
                              setSharing(false);
                              setEditing(location);
                            }}
                          >
                            Editar
                          </button>
                        )}
                        {owner && (
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => {
                              if (!window.confirm(`Excluir ${location.nome}?`)) return;
                              deleteLocation(location.id).catch((error) => {
                                toast.error(error instanceof Error ? error.message : "Não foi possível excluir.");
                              });
                            }}
                          >
                            Excluir
                          </button>
                        )}
                        <LocationMenu id={location.id} />
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>
      <Drawer
        open={creating || Boolean(editing)}
        title={editing ? (sharing ? "Compartilhar local" : "Editar local") : "Novo local"}
        onClose={() => {
          setCreating(false);
          setEditing(null);
          setSharing(false);
        }}
      >
        {(creating || editing) && (
          <LocationForm
            key={editing?.id || "novo"}
            location={editing || undefined}
            onSaved={(id) => {
              setCreating(false);
              setEditing(null);
              setSharing(false);
              if (!editing) router.push(`/admin/locais/${id}`);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
