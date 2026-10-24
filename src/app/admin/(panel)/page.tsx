"use client";

import CustomizableDashboard from "@/components/admin/dashboard/CustomizableDashboard";
import { useClinic } from "@/lib/admin/clinic-context";

export default function HomePage() {
  const { loading } = useClinic();

  if (loading) return <p className="text-muted">Carregando...</p>;

  return <CustomizableDashboard />;
}