"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Empty, PageTitle } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import AgendaPage from "../../agenda/AgendaPage";
import LocationClinicPanel from "../LocationClinicPanel";
import LocationSummary from "../LocationSummary";

export default function LocationPage() {
  const params = useParams<{ id: string }>();
  const { locations, loading } = useClinic();
  const location = locations.find((item) => item.id === params.id);

  if (loading) return <p className="text-muted">Carregando local...</p>;
  if (!location) return <Empty>Local não encontrado.</Empty>;

  return (
    <div>
      <PageTitle
        title={location.nome}
        subtitle={location.endereco || "Atendimentos deste local. Os horários livres são os da sua grade."}
        action={
          <Link href="/admin/locais" className="btn-text">
            Todos os locais
          </Link>
        }
      />
      <LocationSummary location={location} />
      <LocationClinicPanel location={location} />
      <div className="mt-6">
        <Suspense fallback={<p className="text-muted">Carregando agenda...</p>}>
          <AgendaPage locationId={location.id} />
        </Suspense>
      </div>
    </div>
  );
}
