import PublicBookingPage from "@/components/public/PublicBookingPage";
import { normalizeBookingSlug, validateBookingSlug } from "@/lib/booking/slug";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export default async function AgendarPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = normalizeBookingSlug(raw || "");
  if (validateBookingSlug(slug)) {
    return <PublicBookingPage slug={slug} initial={null} unavailable />;
  }

  return <PublicBookingPage slug={slug} initial={null} />;
}
