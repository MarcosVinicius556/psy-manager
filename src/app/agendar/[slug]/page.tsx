import { getAdminDb } from "@/lib/firebase-admin";
import PublicBookingPage from "@/components/public/PublicBookingPage";
import { loadPublicBookingBySlug } from "@/lib/server/booking/public-load";
import { normalizeBookingSlug, validateBookingSlug } from "@/lib/booking/slug";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export default async function AgendarPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = normalizeBookingSlug(raw || "");
  if (validateBookingSlug(slug)) {
    return <PublicBookingPage slug={slug} initial={null} unavailable />;
  }

  const db = getAdminDb();
  if (!db) {
    return <PublicBookingPage slug={slug} initial={null} unavailable />;
  }

  const view = await loadPublicBookingBySlug(db, slug);
  if (!view) {
    return <PublicBookingPage slug={slug} initial={null} unavailable />;
  }

  return <PublicBookingPage slug={slug} initial={view} />;
}
