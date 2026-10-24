import "../styles/globals.css";
import type { Metadata } from "next";
import Header from "@/components/header";
import Providers from "@/components/Providers";
import { Inter, Cormorant_Garamond, Figtree } from "next/font/google";

export const metadata: Metadata = {
  title: "Psy Manager | Gestão para psicólogos",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  description:
    "Agenda, pacientes, financeiro, contratos e relatórios em um só lugar para o consultório de psicologia.",
  keywords: [
    "Psy Manager",
    "sistema para psicólogos",
    "gestão de consultório",
    "agenda psicológica",
    "prontuário",
    "financeiro clínica",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Psy Manager | Gestão para psicólogos",
    description:
      "Agenda, pacientes, financeiro, contratos e relatórios em um só lugar para o consultório de psicologia.",
    siteName: "Psy Manager",
    locale: "pt_BR",
    type: "website",
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-figtree",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable} ${figtree.variable} ${inter.className}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
