"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Drawer from "@/components/admin/Drawer";
import LocationForm from "@/components/admin/LocationForm";
import LocationMenu from "@/components/admin/LocationMenu";
import { Card } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { locationPeople } from "@/lib/admin/workplaces";
import type { CareLocation } from "@/lib/admin/types";

export default function LocationSummary({ location }: { location: CareLocation }) {
  const router = useRouter();
  const { user } = useAuth();
  const { members, locationInvites, deleteLocation } = useClinic();
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const owner = location.createdByUid === user?.uid;
  const people = locationPeople(location, members, locationInvites);

  return (
    <>
      <Card>
        <p className="text-sm text-muted">
          {people.length ? `Profissionais: ${people.join(", ")}` : "Nenhum profissional vinculado."}
        </p>
        {location.observacoes && <p className="mt-2 text-sm">{location.observacoes}</p>}
        <p className="mt-2 text-sm text-muted">
          {owner ? "Você criou este local e pode editá-lo ou excluí-lo." : "Só quem criou este local pode editá-lo ou excluí-lo."}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {owner && (
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setSharing(true);
                setEditing(true);
              }}
            >
              Compartilhar
            </button>
          )}
          {owner && (
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setSharing(false);
                setEditing(true);
              }}
            >
              Editar
            </button>
          )}
          {owner && (
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                if (!window.confirm(`Excluir ${location.nome}?`)) return;
                deleteLocation(location.id)
                  .then(() => router.push("/admin/locais"))
                  .catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível excluir."));
              }}
            >
              Excluir
            </button>
          )}
          <LocationMenu id={location.id} className="btn-text" />
        </div>
      </Card>
      <Drawer
        open={editing}
        title={sharing ? "Compartilhar local" : "Editar local"}
        onClose={() => {
          setEditing(false);
          setSharing(false);
        }}
      >
        {editing && <LocationForm location={location} onSaved={() => setEditing(false)} />}
      </Drawer>
    </>
  );
}
