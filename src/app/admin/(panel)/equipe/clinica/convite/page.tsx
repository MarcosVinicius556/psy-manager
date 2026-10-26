import { redirect } from "next/navigation";

export default async function LegacyClinicInviteQueryRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const raw = query.token ?? query.t;
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (token) redirect(`/admin/locais/convite/${token}`);
  redirect("/admin/locais");
}
