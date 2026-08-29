import '../styles/globals.css';
import type { Metadata } from 'next';
import Header from '@/components/header';
import Script from 'next/script';
import { Inter, Cormorant_Garamond } from "next/font/google";

export const metadata: Metadata = {
  title: "Psicóloga Ellen Santos Machado | Atendimento Humanizado para Ansiedade, Depressão e Autoconhecimento",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  description:
    "Atendimento psicológico online e presencial com a Psicóloga Ellen Santos Machado. Apoio acolhedor para ansiedade, depressão e autoconhecimento.",
  keywords: [
    "psicóloga",
    "psicóloga Ellen Santos Machado",
    "terapia online",
    "terapia presencial",
    "psicologia",
    "ansiedade",
    "depressão",
    "autoconhecimento",
    "atendimento psicológico",
    "psicóloga em Lages",
    "psicóloga em SC",
    "psicóloga em Santa Catarina",
    "psicóloga clínica"
  ],
  authors: [{ name: "Ellen Santos Machado", url: "https://ellen-santos-machado.com.br" }],
  creator: "Ellen Santos Machado",
  publisher: "Ellen Santos Machado",
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  openGraph: {
    title: "Psicóloga Ellen Santos Machado | Atendimento Humanizado para Ansiedade e Autoconhecimento",
    description: "Atendimento psicológico online e presencial com foco em bem-estar emocional, ansiedade, depressão e autoconhecimento.",
    url: "https://ellen-santos-machado.com.br",
    siteName: "Ellen Santos Machado - Psicóloga",
    images: [
      {
        url: "https://ellen-santos-machado.com.br/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Psicóloga Ellen Santos Machado - Atendimento humanizado e acolhedor",
        type: "image/jpeg",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psicóloga Ellen Santos Machado | Atendimento Humanizado para Ansiedade e Autoconhecimento",
    description: "Atendimento psicológico online e presencial com foco em bem-estar emocional, ansiedade, depressão e autoconhecimento.",
    images: ["https://ellen-santos-machado.com.br/images/logo.png"],
  },
  alternates: {
    canonical: "https://ellen-santos-machado.com.br",
  },
  category: "business"
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  let measurementId = process.env.GA_MEASUREMENT_ID;
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
          <meta
            name="google-site-verification"
            content="xc8iyy7wr62wsB2oXh7fMydxG2c5Ax3oK4CZdSILBSE"
          />
      </head>
      <body>
          <Script
            id="ld-json"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                name: "Ellen Santos Machado",
                url: "https://ellen-santos-machado.com.br",
                image: "https://ellen-santos-machado.com.br/images/logo.png",
                sameAs: [
                  "https://www.facebook.com/ellenmachadopsicologa",
                  "https://www.instagram.com/ellenmachado_psi",
                  "https://www.linkedin.com/in/ellen-santos-machado",
                ],
                jobTitle: "Psicóloga",
                telephone: "+55-49-98840-1516",
                email: "ellensmpsi@gmail.com",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "R. Lídio Réis, 114 - Centro",
                  addressLocality: "Lages",
                  addressRegion: "SC",
                  postalCode: "88502-150",
                  addressCountry: "BR",
                },
                description:
                  "Psicóloga especializada em terapia cognitivo-comportamental, oferecendo atendimento humanizado online e presencial.",
              }),
            }}
          />
          <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
          />

          <Script
            id="google-analytics"
            strategy="afterInteractive"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${measurementId}');
            `}
          </Script>
        
          <Header />
          {children}
        </body>
      </html>
  );
}
