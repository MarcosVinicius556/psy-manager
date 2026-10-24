import { describe, expect, it } from "vitest";
import {
  loginPathForArea,
  sessionIdlePhase,
  sessionIdleSecondsLeft,
  shouldTrackSessionIdle,
} from "./session-idle";

const IDLE = 30 * 60 * 1000;
const WARNING = 60 * 1000;

describe("sessionIdlePhase", () => {
  it("permanece ativo antes do limite de inatividade", () => {
    const start = 1_000_000;
    expect(sessionIdlePhase(start, start + IDLE - 1, IDLE, WARNING)).toBe("active");
  });

  it("entra em aviso após o tempo de inatividade", () => {
    const start = 1_000_000;
    expect(sessionIdlePhase(start, start + IDLE, IDLE, WARNING)).toBe("warning");
    expect(sessionIdlePhase(start, start + IDLE + WARNING - 1, IDLE, WARNING)).toBe("warning");
  });

  it("expira após o aviso", () => {
    const start = 1_000_000;
    expect(sessionIdlePhase(start, start + IDLE + WARNING, IDLE, WARNING)).toBe("expired");
  });
});

describe("sessionIdleSecondsLeft", () => {
  it("conta regressivamente durante o aviso", () => {
    const start = 0;
    const atWarning = IDLE + 10_000;
    expect(sessionIdleSecondsLeft(start, atWarning, IDLE, WARNING)).toBe(50);
  });

  it("não retorna valores negativos após expirar", () => {
    const start = 0;
    expect(sessionIdleSecondsLeft(start, IDLE + WARNING + 5_000, IDLE, WARNING)).toBe(0);
  });
});

describe("shouldTrackSessionIdle", () => {
  it("ignora páginas públicas de feedback", () => {
    expect(shouldTrackSessionIdle("/feedback/abc")).toBe(false);
    expect(shouldTrackSessionIdle("/feedback")).toBe(false);
  });

  it("acompanha rotas autenticadas", () => {
    expect(shouldTrackSessionIdle("/admin")).toBe(true);
    expect(shouldTrackSessionIdle("/plataforma/contas")).toBe(true);
  });
});

describe("loginPathForArea", () => {
  it("direciona plataforma e admin corretamente", () => {
    expect(loginPathForArea("/plataforma/auditoria")).toBe("/plataforma/login");
    expect(loginPathForArea("/admin/pacientes")).toBe("/admin/login");
  });
});
