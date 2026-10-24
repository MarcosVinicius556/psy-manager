import { describe, expect, it } from "vitest";
import { appointmentEventTitle, appointmentToGoogleEventBody, patientFirstName } from "./event-mapping";

describe("mapeamento atendimento → evento Google", () => {
  it("extrai o primeiro nome do paciente", () => {
    expect(patientFirstName("Maria Clara Souza")).toBe("Maria");
    expect(patientFirstName("  ")).toBe("");
  });

  it("usa título genérico ou com primeiro nome", () => {
    expect(appointmentEventTitle("generic", { nome: "João Pedro" })).toBe("Atendimento");
    expect(appointmentEventTitle("first_name", { nome: "João Pedro" })).toBe("Atendimento - João");
  });

  it("monta corpo do evento sem dados clínicos", () => {
    const body = appointmentToGoogleEventBody(
      {
        date: "2026-10-24",
        startTime: "09:00",
        endTime: "10:00",
        modality: "online",
        status: "agendado",
      },
      "Atendimento"
    );
    expect(body.summary).toBe("Atendimento");
    expect(body.description).toContain("online");
    expect((body.start as { dateTime: string }).dateTime).toBe("2026-10-24T09:00:00");
    expect(body.status).toBe("confirmed");
  });

  it("inclui conferenceData para teleconsulta com Meet", () => {
    const body = appointmentToGoogleEventBody(
      {
        date: "2026-10-24",
        startTime: "09:00",
        endTime: "10:00",
        modality: "online",
        status: "agendado",
      },
      "Atendimento",
      "America/Sao_Paulo",
      { withMeet: true, meetRequestId: "req-1" }
    );
    const conference = body.conferenceData as { createRequest?: { requestId?: string } };
    expect(conference?.createRequest?.requestId).toBe("req-1");
  });
});
