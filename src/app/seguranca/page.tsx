import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { SEGURANCA_SECTIONS } from "@/lib/legal/sections";

export const metadata: Metadata = {
  title: "Segurança da Informação | Psy Manager",
  description: "Medidas técnicas e organizacionais adotadas pela Psy Manager para proteger dados de conta e dados clínicos.",
};

export default function SecurityPage() {
  return (
    <LegalDocumentPage
      title="Segurança da Informação"
      description="Resumo das práticas de segurança aplicadas à infraestrutura e ao desenvolvimento da plataforma."
      version="1.0"
      effectiveFrom="24/10/2026"
      sections={SEGURANCA_SECTIONS}
      related={[{ href: "/suboperadores", label: "Ver suboperadores" }]}
    />
  );
}
