"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppointmentForm from "@/components/admin/AppointmentForm";
import ClinicalForm from "@/components/admin/ClinicalForm";
import FeedbackShare from "@/components/admin/FeedbackShare";
import NoShowChargeSuggestion from "@/components/admin/NoShowChargeSuggestion";
import AbsenceForm from "@/components/admin/AbsenceForm";
import Drawer from "@/components/admin/Drawer";
import { Card, Empty, PageTitle, Pill } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { formatDate, labelAppointmentStatus, labelModality, labelSessionType } from "@/lib/admin/format";

export default function AppointmentPage() {
  const params = useParams<{ id: string }>();
  const {
    appointments,
    patients,
    packages,
    sessionFeedbacks,
    loading,
    patientName,
    memberName,
    locationName,
    setAppointmentStatus,
    updateAbsenceJustification,
    ensureAppointmentLoaded,
    loadClinicalForAppointment,
  } = useClinic();
  const [editing, setEditing] = useState(false);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(false);
  const appointment = appointments.find((item) => item.id === params.id);

  useEffect(() => {
    if (!params.id || loading) return;
    if (appointment) {
      void loadClinicalForAppointment(params.id);
      return;
    }
    void ensureAppointmentLoaded(params.id).then(() => loadClinicalForAppointment(params.id));
  }, [appointment, ensureAppointmentLoaded, loadClinicalForAppointment, loading, params.id]);
  const feedback = sessionFeedbacks.find((item) => item.appointmentId === params.id);
  const patient = patients.find((item) => item.id === appointment?.patientId);
  const pack = packages.find((item) => item.id === appointment?.packageId);

  if (loading) return <p className="text-muted">Carregando atendimento...</p>;
  if (!appointment) return <Empty>Atendimento não encontrado.</Empty>;

  const canStart = appointment.status === "agendado";
  const canMark = appointment.status === "agendado" || appointment.status === "em_andamento";

  return (
    <div>
      <PageTitle
        title={patientName(appointment.patientId)}
        subtitle={`${formatDate(appointment.date)} · ${appointment.startTime}–${appointment.endTime} · ${labelSessionType(appointment.sessionType)} · ${labelModality(appointment.modality)}${appointment.locationId ? ` · ${locationName(appointment.locationId)}` : ""}${pack ? ` · ${pack.nome}${appointment.packageVersao ? ` v${appointment.packageVersao}` : ""}` : ""}${appointment.recurring ? " · recorrente" : ""} · ${memberName(appointment.professionalId)}`}
        action={<Link href={`/admin/pacientes/${appointment.patientId}`} className="btn-text">Ficha do paciente</Link>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3" data-tour="atendimento-acoes">
        <Pill tone={appointment.status === "concluido" ? "teal" : "sage"}>{labelAppointmentStatus(appointment.status)}</Pill>
        {canStart && (
          <button type="button" className="btn-primary" onClick={() => setAppointmentStatus(appointment.id, "em_andamento")}>
            Iniciar atendimento
          </button>
        )}
        {canMark && (
          <>
            <button type="button" className="btn-text" onClick={() => setAbsenceOpen((open) => !open)}>
              Não compareceu
            </button>
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setAppointmentStatus(appointment.id, "cancelado").catch(() => toast.error("Não foi possível cancelar."));
              }}
            >
              Cancelar
            </button>
          </>
        )}
        {appointment.status !== "concluido" && (
          <button type="button" className="btn-text" onClick={() => setEditing(true)}>
            Alterar horário
          </button>
        )}
      </div>

      {absenceOpen && (
        <Card className="mb-4">
          <h2 className="text-2xl font-medium text-teal">Paciente não compareceu</h2>
          <p className="mt-2 text-sm text-muted">
            Informe se a falta foi justificada. Suas regras de cobrança por falta decidem se haverá cobrança.
          </p>
          <AbsenceForm
            submitLabel="Confirmar falta"
            onCancel={() => setAbsenceOpen(false)}
            onSubmit={async ({ justificada, texto }) => {
              try {
                await setAppointmentStatus(appointment.id, "faltou", undefined, texto, justificada);
                setAbsenceOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Não foi possível registrar a falta.");
              }
            }}
          />
        </Card>
      )}
      {appointment.status === "faltou" ? <NoShowChargeSuggestion appointment={appointment} /> : null}
      {appointment.status === "faltou" && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-medium text-teal">Justificativa da falta</h2>
            {!editingAbsence ? (
              <button type="button" className="btn-text" onClick={() => setEditingAbsence(true)}>
                Editar
              </button>
            ) : null}
          </div>
          {editingAbsence ? (
            <AbsenceForm
              initialJustificada={appointment.faltaJustificada === true}
              initialTexto={appointment.faltaJustificativa}
              submitLabel="Salvar justificativa"
              onCancel={() => setEditingAbsence(false)}
              onSubmit={async ({ justificada, texto }) => {
                try {
                  await updateAbsenceJustification(appointment.id, justificada, texto);
                  setEditingAbsence(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Não foi possível salvar a justificativa.");
                }
              }}
            />
          ) : (
            <>
              <p className="mt-2 text-sm font-medium text-ink">
                {appointment.faltaJustificada === true
                  ? "Falta justificada"
                  : appointment.faltaJustificada === false
                    ? "Falta sem justificativa"
                    : "Registrada antes das regras de falta (sem classificação)"}
              </p>
              <p className="mt-1 text-muted">{appointment.faltaJustificativa || "Nenhum texto informado."}</p>
            </>
          )}
        </Card>
      )}
      {appointment.status === "concluido" && feedback && (
        <Card className="mb-4">
          <h2 className="mb-3 text-2xl font-medium text-teal">Feedback do paciente</h2>
          <FeedbackShare feedback={feedback} patientEmail={patient?.email || ""} />
        </Card>
      )}
      <Card>
        <h2 className="mb-4 text-2xl font-medium text-teal">Ficha do atendimento</h2>
        {appointment.status === "agendado" ? (
          <Empty>Inicie o atendimento para registrar humor, evolução e anotações.</Empty>
        ) : (
          <ClinicalForm key={appointment.updatedAt} appointment={appointment} />
        )}
      </Card>
      <Drawer open={editing} title="Alterar atendimento" onClose={() => setEditing(false)}>
        {editing && <AppointmentForm appointment={appointment} onSaved={() => setEditing(false)} />}
      </Drawer>
    </div>
  );
}
