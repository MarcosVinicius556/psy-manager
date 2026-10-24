"use client";

import { useParams } from "next/navigation";
import ContractTemplateForm from "@/components/admin/ContractTemplateForm";

export default function EditContractTemplatePage() {
  const params = useParams<{ id: string }>();
  return <ContractTemplateForm templateId={params.id} />;
}
