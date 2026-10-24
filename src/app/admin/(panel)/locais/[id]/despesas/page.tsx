"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Empty, PageTitle } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import RoomExpenses from "../../../sala/RoomExpenses";
import LocationSummary from "../../LocationSummary";

export default function LocationExpensesPage() {
  const params = useParams<{ id: string }>();
  const { locations, loading } = useClinic();
  const location = locations.find((item) => item.id === params.id);

  if (loading) return <p className="text-muted">Carregando despesas...</p>;
  if (!location) return <Empty>Local não encontrado.</Empty>;

  return (
    <div>
      <PageTitle
        title={location.nome}
        subtitle={location.endereco || "Despesas deste local."}
        action={
          <Link href="/admin/locais" className="btn-text">
            Todos os locais
          </Link>
        }
      />
      <LocationSummary location={location} />
      <div className="mt-6">
        <RoomExpenses locationId={location.id} />
      </div>
    </div>
  );
}
