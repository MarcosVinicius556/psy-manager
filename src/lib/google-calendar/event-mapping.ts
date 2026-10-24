import type { Appointment, Patient } from "@/lib/admin/types";
import type { GoogleCalendarEventTitleMode } from "./types";

export function patientFirstName(nome: string) {
  const trimmed = nome.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] || "";
}

export function appointmentEventTitle(
  mode: GoogleCalendarEventTitleMode,
  patient: Pick<Patient, "nome"> | undefined
) {
  if (mode === "generic") return "Atendimento";
  const first = patientFirstName(patient?.nome || "");
  return first ? `Atendimento - ${first}` : "Atendimento";
}

export function appointmentToGoogleEventBody(
  appointment: Pick<Appointment, "date" | "startTime" | "endTime" | "modality" | "status">,
  title: string,
  timeZone = "America/Sao_Paulo"
) {
  const start = `${appointment.date}T${appointment.startTime}:00`;
  const end = `${appointment.date}T${appointment.endTime}:00`;
  const description =
    appointment.modality === "online"
      ? "Sessão online (Psy Manager)"
      : "Sessão presencial (Psy Manager)";
  const cancelled = appointment.status === "cancelado";
  return {
    summary: title,
    description,
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
    status: cancelled ? "cancelled" : "confirmed",
    transparency: "opaque" as const,
  };
}

export function googleBusyToBlocks(
  date: string,
  items: { start: string; end: string }[]
): { date: string; startTime: string; endTime: string }[] {
  return items
    .filter((item) => item.start.slice(0, 10) === date || item.end.slice(0, 10) === date)
    .map((item) => {
      const startTime = item.start.includes("T") ? item.start.split("T")[1]?.slice(0, 5) || "00:00" : "00:00";
      const endTime = item.end.includes("T") ? item.end.split("T")[1]?.slice(0, 5) || "23:59" : "23:59";
      return { date, startTime, endTime };
    });
}
