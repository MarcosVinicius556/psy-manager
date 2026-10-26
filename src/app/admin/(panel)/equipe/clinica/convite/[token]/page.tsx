import { redirect } from "next/navigation";

export default async function LegacyClinicInviteRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/admin/locais/convite/${token}`);
}
