import { describe, expect, it } from "vitest";
import { MAIN_ROUTES, TOURS, tourForPath } from "./tours";

describe("guided tours", () => {
  it.each(MAIN_ROUTES)("has a tour for %s", (route) => {
    const tour = tourForPath(route);
    expect(tour).not.toBeNull();
    expect(tour!.steps.length).toBeGreaterThan(0);
  });

  it("matches specific routes before generic ones", () => {
    expect(tourForPath("/admin/atendimentos/novo")?.id).toBe("admin-atendimento-novo");
    expect(tourForPath("/admin/pacientes/novo")?.id).toBe("admin-pacientes-novo");
    expect(tourForPath("/admin/configuracoes/agendamento-publico")?.id).toBe("admin-agendamento-publico");
    expect(tourForPath("/admin/equipe/supervisao")?.id).toBe("admin-supervisao");
    expect(tourForPath("/plataforma/contas/x")?.id).toBe("plataforma-conta");
  });

  it("uses unique ids and pt-BR copy", () => {
    const ids = TOURS.map((tour) => tour.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tour of TOURS) for (const step of tour.steps) expect(step.description.length).toBeGreaterThan(10);
  });
});
