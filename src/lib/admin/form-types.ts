export type FormFieldType = "text" | "textarea" | "select" | "date" | "checkbox";

export interface FormFieldDef {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

export interface FormTemplate {
  id: string;
  nome: string;
  descricao: string;
  versao: number;
  campos: FormFieldDef[];
  finalidade: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormRequest {
  id: string;
  patientId: string;
  patientNome: string;
  templateId: string;
  templateNome: string;
  templateVersion: number;
  expiresAt: string;
  createdAt: string;
  answeredAt: string | null;
}

export interface FormResponseRecord {
  id: string;
  patientId: string;
  templateId: string;
  templateVersion: number;
  requestToken: string;
  respostas: Record<string, string>;
  submittedAt: string;
}

export type PublicFormView = {
  title: string;
  finalidade: string;
  version: number;
  fields: FormFieldDef[];
  expired: boolean;
  answered: boolean;
};
