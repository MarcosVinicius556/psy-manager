import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendar sessão | Psy Manager",
  robots: { index: false, follow: false },
};

export default function PublicBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
