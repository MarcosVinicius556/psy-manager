import type { Mood } from "@/lib/admin/types";

export type PatientAccountLink = {
  uid: string;
  ownerUid: string;
  patientId: string;
  email: string;
};

export type PatientJournalComment = {
  id: string;
  texto: string;
  createdAt: string;
  authorUid: string;
};

export type PatientJournalEntry = {
  id: string;
  dia: string;
  humor: Mood | "";
  texto: string;
  compartilhado: boolean;
  comentarios: PatientJournalComment[];
  createdAt: string;
  updatedAt: string;
};

export type PatientHomeworkTask = {
  id: string;
  titulo: string;
  prazo: string | null;
  concluidaEm: string | null;
  createdAt: string;
};

export type PatientMuralMessage = {
  id: string;
  texto: string;
  createdAt: string;
};

export const PORTAL_INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
