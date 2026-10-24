import { describe, expect, it } from "vitest";
import { sessionPaymentAmount, defaultSessionClosePayment } from "./session-close";
import type { Appointment, SessionPackage } from "./types";
import { emptyClinical } from "./types";

function appt(partial: Partial<Appointment>): Appointment {
  return {
    id: "a1",
    patientId: "p1",
    professionalId: null,
    locationId: null,
    date: "2026-01-01",
    startTime: "10:00",
    endTime: "11:00",
    modality: "presencial",
    sessionType: "padrao",
    valor: 0,
    valorSocial: false,
    packageId: null,
    packageVersao: null,
    creditoEmHaver: false,
    faltaJustificativa: "",
    recurring: false,
    seriesId: null,
    status: "agendado",
    clinical: emptyClinical(),
    accessUids: [],
    googleEventId: null,
    googleLocationEventId: null,
    googleMeetLink: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("session close payment", () => {
  it("usa valor do atendimento ou do pacote", () => {
    const packages: SessionPackage[] = [
      {
        id: "pk1",
        professionalId: null,
        nome: "Mensal",
        tipo: "mensal",
        valorSessao: 180,
        sessoes: 4,
        versao: 1,
        observacoes: "",
        historico: [],
        arquivado: false,
        arquivadoEm: null,
        createdAt: "",
        updatedAt: "",
      },
    ];
    expect(sessionPaymentAmount(appt({ valor: 200 }), packages)).toBe(200);
    expect(sessionPaymentAmount(appt({ packageId: "pk1" }), packages)).toBe(180);
  });

  it("pré-preenche pagamento no fluxo de encerramento", () => {
    const defaults = defaultSessionClosePayment(appt({ valor: 150 }), [], null);
    expect(defaults.valor).toBe(150);
    expect(defaults.formaPagamento).toBe("pix");
  });
});
