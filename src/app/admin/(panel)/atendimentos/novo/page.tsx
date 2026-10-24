import { redirect } from "next/navigation";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; patientId?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ novo: "1" });
  if (params.date) query.set("date", params.date);
  if (params.patientId) query.set("patientId", params.patientId);
  redirect(`/admin/agenda?${query.toString()}`);
}
