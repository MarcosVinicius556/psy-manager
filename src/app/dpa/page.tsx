import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/lib/legal/config";
import { DPA_SECTIONS } from "@/lib/legal/sections";

export const metadata: Metadata = {
  title: "Acordo de Tratamento de Dados (DPA) | Psy Manager",
  description: "Contrato de operação LGPD entre a clínica controladora e a Psy Manager como operadora de dados clínicos.",
};

export default function DpaPage() {
  const meta = LEGAL_DOCUMENTS.dpa;
  return (
    <LegalDocumentPage
      title="Acordo de Tratamento de Dados (DPA)"
      description="Documento contratual que complementa os Termos de Uso para o tratamento de dados pessoais, inclusive sensíveis, inseridos no painel."
      version={meta.version}
      effectiveFrom={meta.effectiveFrom}
      sections={DPA_SECTIONS}
      related={[
        { href: "/termos", label: "Termos de Uso" },
        { href: "/privacidade", label: "Política de Privacidade" },
      ]}
    />
  );
}
