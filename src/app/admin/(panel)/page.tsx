"use client";

import CustomizableDashboard from "@/components/admin/dashboard/CustomizableDashboard";
import { useClinic } from "@/lib/admin/clinic-context";

export default function HomePage() {
  const { loading } = useClinic();

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="h-8 w-40 animate-pulse rounded-md bg-sky-soft" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-md bg-white shadow-[0_18px_50px_rgba(61,82,64,0.08)]" />
          <div className="h-32 animate-pulse rounded-md bg-white shadow-[0_18px_50px_rgba(61,82,64,0.08)]" />
        </div>
      </div>
    );
  }

  return <CustomizableDashboard />;
}