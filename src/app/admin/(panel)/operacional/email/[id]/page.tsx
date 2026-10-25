"use client";

import { useParams } from "next/navigation";
import EmailTemplateForm from "@/components/admin/EmailTemplateForm";

export default function EditEmailTemplatePage() {
  const params = useParams<{ id: string }>();
  return <EmailTemplateForm templateId={params.id} />;
}
