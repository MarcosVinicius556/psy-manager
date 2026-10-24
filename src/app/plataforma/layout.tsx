import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plataforma | Psy Manager",
  robots: { index: false, follow: false },
};

export default function PlatformRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
