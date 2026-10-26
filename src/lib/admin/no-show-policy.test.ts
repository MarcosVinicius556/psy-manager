import { describe, expect, it } from "vitest";
import { computeNoShowCharge, formatPoliticaFalta, normalizePoliticaFalta } from "./no-show-policy";
import type { Appointment, ClinicMember } from "./types";

const baseAppointment: Appointment = {
  id: "a1",
  patientId: "p1",
  professionalId: "m1",
  locationId: null,
  date: "2026-10-27",
  startTime: "10:00",
  endTime: "10:50",
  modality: "presencial",
  sessionType: "padrao",
  valor: 200,
  valorSocial: false,
  packageId: null,
  packageVersao: null,
  creditoEmHaver: false,
  faltaJustificativa: "",
  recurring: false,
  seriesId: null,
  status: "faltou",
  clinical: {
    mood: "",
    approach: "",
    templateId: "",
    sections: {},
    restrictedNote: "",
    clinicalEvolution: "",
    notes: "",
    aspectosCognitivos: "",
    aspectosEmocionais: "",
    intervencoes: "",
    objetivos: "",
    evolucaoSessao: "",
    anamneseArquivos: [],
    atividadesArquivos: [],
  },
  accessUids: ["u1"],
  googleEventId: null,
  googleLocationEventId: null,
  googleMeetLink: null,
  createdAt: "",
  updatedAt: "",
};

const baseMember: ClinicMember = {
  id: "m1",
  uid: "u1",
  nome: "Dra. Ana",
  email: "ana@example.com",
  telefone: "",
  foto: "",
  cpf: "",
  crpNumero: "",
  crpRegiao: "",
  enderecoLogradouro: "",
  enderecoCidade: "",
  enderecoUf: "",
  enderecoCep: "",
  reciboSequencia: 0,
  valorBase: 250,
  valorSocial: 80,
  workHours: [],
  contratoModelo: "",
  politicaFalta: { horas: 24, percentual: 50 },
  ativo: true,
  createdAt: "",
};

describe("no-show policy", () => {
  it("normaliza limites", () => {
    expect(normalizePoliticaFalta({ horas: 999, percentual: 120 })).toEqual({ horas: 168, percentual: 100 });
  });

  it("calcula cobrança sugerida", () => {
    const charge = computeNoShowCharge(baseAppointment, baseMember);
    expect(charge?.valor).toBe(100);
  });

  it("formata texto do contrato", () => {
    expect(formatPoliticaFalta({ horas: 24, percentual: 100 })).toContain("24 horas");
  });
});
