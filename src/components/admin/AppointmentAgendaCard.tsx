"use client";

import Link from "next/link";
import type { Appointment } from "@/lib/admin/types";

export default function AppointmentAgendaCard({
  appointment,
  patientLabel,
  metaLine,
  isOwn,
  onCompleteSession,
}: {
  appointment: Appointment;
  patientLabel: string;
  metaLine: string;
  isOwn: boolean;
  onCompleteSession?: (appointment: Appointment) => void;
}) {
  const canComplete =
    isOwn &&
    onCompleteSession &&
    (appointment.status === "agendado" || appointment.status === "em_andamento");
  const meetLink = appointment.modality === "online" ? appointment.googleMeetLink : null;

  return (
    <div className="motion-press min-h-11 rounded-md border border-[#e7eee8] bg-sky-soft px-3 py-2.5 text-sm shadow-[0_8px_24px_rgba(61,82,64,0.05)]">
      <Link href={`/admin/atendimentos/${appointment.id}`} className="block text-ink">
        <strong>
          {appointment.startTime}–{appointment.endTime}
        </strong>{" "}
        {patientLabel}
        <span className="mt-0.5 block text-muted">{metaLine}</span>
      </Link>
      {(meetLink || canComplete) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {meetLink ? (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-row min-h-11"
            >
              Entrar na sessão
            </a>
          ) : null}
          {canComplete ? (
            <button type="button" className="btn-primary min-h-11" onClick={() => onCompleteSession(appointment)}>
              Concluir sessão
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
