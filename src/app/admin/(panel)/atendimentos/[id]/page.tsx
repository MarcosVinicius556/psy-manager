"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import AppointmentForm from "@/components/admin/AppointmentForm";
import ClinicalForm from "@/components/admin/ClinicalForm";
import FeedbackShare from "@/components/admin/FeedbackShare";
import NoShowChargeSuggestion from "@/components/admin/NoShowChargeSuggestion";
import Drawer from "@/components/admin/Drawer";
import { Card, Empty, Field, PageTitle, Pill, fieldClass } from "@/components/admin/ui";
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
    ensureAppointmentLoaded,
    loadClinicalForAppointment,
  } = useClinic();
  const [editing, setEditing] = useState(false);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [savingAbsence, setSavingAbsence] = useState(false);
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
            A justificativa é opcional.
          </p>
          <form
            className="mt-4 grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSavingAbsence(true);
              try {
                await setAppointmentStatus(appointment.id, "faltou", undefined, justificativa);
                setAbsenceOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Não foi possível registrar a falta.");
              } finally {
                setSavingAbsence(false);
              }
            }}
          >
            <Field label="Justificativa">
              <textarea
                className={`${fieldClass} min-h-24`}
                value={justificativa}
                onChange={(event) => setJustificativa(event.target.value)}
                placeholder="Opcional"
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" disabled={savingAbsence}>
                {savingAbsence ? "Salvando..." : "Confirmar falta"}
              </button>
              <button type="button" className="btn-text" onClick={() => setAbsenceOpen(false)}>
                Voltar
              </button>
            </div>
          </form>
        </Card>
      )}
      {appointment.status === "faltou" ? <NoShowChargeSuggestion appointment={appointment} /> : null}
      {appointment.status === "faltou" && appointment.faltaJustificativa && (
        <Card className="mb-4">
          <h2 className="text-2xl font-medium text-teal">Justificativa da falta</h2>
          <p className="mt-2 text-muted">{appointment.faltaJustificativa}</p>
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
