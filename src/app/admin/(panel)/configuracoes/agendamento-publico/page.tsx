"use client";

import { PageTitle } from "@/components/admin/ui";
import BookingPublicSettingsCard from "@/components/admin/BookingPublicSettingsCard";

export default function PublicBookingSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Agendamento público" subtitle="Link para pacientes solicitarem horários com aprovação manual." />
      <BookingPublicSettingsCard />
    </div>
  );
}
