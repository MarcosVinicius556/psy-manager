import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/lib/legal/config";
import { PRIVACIDADE_SECTIONS } from "@/lib/legal/sections";

export const metadata: Metadata = {
  title: "Política de Privacidade | Psy Manager",
  description: "Como a Psy Manager trata dados de conta e dados clínicos na LGPD, papéis de controlador e operador, e direitos do titular.",
};

export default function PrivacyPage() {
  const meta = LEGAL_DOCUMENTS.privacidade;
  return (
    <LegalDocumentPage
      title="Política de Privacidade"
      description="Esta política descreve o tratamento de dados pessoais na plataforma Psy Manager, incluindo dados sensíveis de saúde tratados em nome da psicóloga ou clínica controladora."
      version={meta.version}
      effectiveFrom={meta.effectiveFrom}
      sections={PRIVACIDADE_SECTIONS}
      related={[
        { href: "/termos", label: "Ler os Termos de Uso" },
        { href: "/dpa", label: "Ler o DPA" },
      ]}
    />
  );
}
