import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/lib/legal/config";
import { TERMOS_SECTIONS } from "@/lib/legal/sections";

export const metadata: Metadata = {
  title: "Termos de Uso | Psy Manager",
  description: "Condições de uso do SaaS Psy Manager para psicólogos e clínicas, avaliação, responsabilidades profissionais e LGPD.",
};

export default function TermsPage() {
  const meta = LEGAL_DOCUMENTS.termos;
  return (
    <LegalDocumentPage
      title="Termos de Uso"
      description="Ao usar a Psy Manager, você concorda com estas condições, que devem ser lidas em conjunto com a Política de Privacidade e o DPA."
      version={meta.version}
      effectiveFrom={meta.effectiveFrom}
      sections={TERMOS_SECTIONS}
      related={[{ href: "/privacidade", label: "Ler a Política de Privacidade" }]}
    />
  );
}
