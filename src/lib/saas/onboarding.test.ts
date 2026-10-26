import { describe, expect, it } from "vitest";
import { emptyAccount } from "./model";
import { buildOnboardingSteps } from "./onboarding";

const account = {
  ...emptyAccount("uid-a", "pro@example.com"),
  nome: "Ana Silva",
  clinicName: "Consultório Ana",
};

describe("onboarding checklist", () => {
  it("marca etapas obrigatórias a partir dos dados existentes", () => {
    const snapshot = buildOnboardingSteps({
      account,
      patients: [{ id: "p1" } as never],
      appointments: [{ id: "a1", status: "agendado" } as never],
      payments: [],
      member: { workHours: [{ weekday: 1, startTime: "09:00", endTime: "10:00" }] } as never,
      googleCalendarConnected: false,
    });
    expect(snapshot.requiredDone).toBe(4);
    expect(snapshot.complete).toBe(false);
    expect(snapshot.steps.find((step) => step.id === "google_calendar")?.optional).toBe(true);
  });

  it("considera completo quando obrigatórias terminam", () => {
    const snapshot = buildOnboardingSteps({
      account,
      patients: [{ id: "p1" } as never],
      appointments: [
        { id: "a1", status: "agendado" } as never,
        { id: "a2", status: "concluido" } as never,
      ],
      payments: [{ id: "pay1", status: "pago", reciboFiscal: { numero: 1 } } as never],
      member: { workHours: [{ weekday: 1, startTime: "09:00", endTime: "10:00" }] } as never,
      googleCalendarConnected: false,
    });
    expect(snapshot.complete).toBe(true);
  });
});
