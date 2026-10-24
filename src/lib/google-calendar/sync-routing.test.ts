import { describe, expect, it } from "vitest";
import {
  labelGoogleBusyBlock,
  locationIntegrationApplies,
  professionalIntegrationApplies,
  uidForProfessional,
} from "./sync-routing";
import type { GoogleCalendarPrivateRecord } from "./types";

const integration = (overrides: Partial<GoogleCalendarPrivateRecord> = {}): GoogleCalendarPrivateRecord => ({
  refreshTokenEncrypted: "enc",
  googleEmail: "a@b.com",
  calendarId: "cal-1",
  calendarSummary: "Agenda",
  syncToGoogle: true,
  syncFromGoogle: true,
  blockGoogleBusy: true,
  showGoogleEventTitles: false,
  eventTitleMode: "generic",
  connectedAt: "2026-01-01",
  ...overrides,
});

describe("roteamento de sync por profissional", () => {
  it("resolve uid do profissional responsável", () => {
    const members = [{ id: "m1", uid: "uid-ana" }, { id: "m2", uid: "uid-bia" }];
    expect(uidForProfessional("m1", members)).toBe("uid-ana");
    expect(uidForProfessional("m9", members)).toBeNull();
  });

  it("sincroniza pelo profissional do atendimento, não pelo criador", () => {
    const applies = professionalIntegrationApplies(
      integration(),
      { professionalId: "m1" },
      "uid-ana",
      "m1"
    );
    expect(applies).toBe(true);
    expect(
      professionalIntegrationApplies(integration(), { professionalId: "m2" }, "uid-ana", "m1")
    ).toBe(false);
  });

  it("aplica calendário do consultório quando há local", () => {
    expect(locationIntegrationApplies(integration(), { locationId: "loc-1" })).toBe(true);
    expect(locationIntegrationApplies(integration({ syncToGoogle: false }), { locationId: "loc-1" })).toBe(false);
    expect(locationIntegrationApplies(integration(), { locationId: null })).toBe(false);
  });
});

describe("privacidade em locais compartilhados", () => {
  it("mascara eventos de colegas", () => {
    const masked = labelGoogleBusyBlock({
      viewerUid: "uid-a",
      subjectUid: "uid-b",
      showTitlesForSubject: true,
      rawTitle: "Reunião secreta",
    });
    expect(masked.label).toBe("Ocupado");
    expect(masked.masked).toBe(true);
  });

  it("mostra título só para o próprio usuário quando permitido", () => {
    const own = labelGoogleBusyBlock({
      viewerUid: "uid-a",
      subjectUid: "uid-a",
      showTitlesForSubject: true,
      rawTitle: "Almoço",
    });
    expect(own.label).toBe("Almoço");
    expect(own.masked).toBe(false);
  });
});
