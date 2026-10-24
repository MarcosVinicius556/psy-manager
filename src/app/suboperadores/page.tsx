import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { SUBOPERADORES_SECTIONS } from "@/lib/legal/sections";

export const metadata: Metadata = {
  title: "Suboperadores | Psy Manager",
  description: "Lista de suboperadores que tratam dados em nome da Psy Manager e notas sobre transferência internacional.",
};

export default function SubprocessorsPage() {
  return (
    <LegalDocumentPage
      title="Suboperadores"
      description="Fornecedores que processam dados pessoais conforme instruções da Psy Manager, com possível transferência internacional."
      version="1.0"
      effectiveFrom="24/10/2026"
      sections={SUBOPERADORES_SECTIONS}
      related={[{ href: "/privacidade", label: "Política de Privacidade" }]}
    />
  );
}
