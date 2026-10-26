import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

import { loginAsDemo } from "./helpers/login";
import { e2eFeedbackDocId } from "./helpers/feedback-tokens";

const publicRoutes = [
  "/",
  "/admin/login",
  "/plataforma/login",
  "/termos",
  "/privacidade",
  "/cookies",
  "/seguranca",
  "/suboperadores",
  "/dpa",
  `/feedback/${e2eFeedbackDocId(1)}`,
  "/agendar/marina-costa",
] as const;

const adminRoutes = [
  "/admin",
  "/admin/agenda",
  "/admin/pacientes",
  "/admin/pacientes/pat-ana",
  "/admin/financeiro",
  "/admin/financeiro/receita-saude",
  "/admin/configuracoes",
  "/admin/configuracoes/agendamento-publico",
  "/admin/notificacoes",
  "/admin/locais",
  "/admin/pacotes",
  "/admin/assinatura",
  "/admin/usuarios",
  "/admin/operacional/contrato",
  "/admin/operacional/relatorios",
  "/admin/operacional/consentimento",
] as const;

/** Routes may not declare data-allow-horizontal-scroll unless listed here (count per route). */
const horizontalScrollAllowlist: Record<string, number> = {};

async function assertNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const docOverflow = doc.scrollWidth - doc.clientWidth;
    const offenders: string[] = [];
    const all = document.querySelectorAll<HTMLElement>("*");
    for (const el of all) {
      if (el.closest("[data-allow-horizontal-scroll='true']")) continue;
      const style = getComputedStyle(el);
      const ox = style.overflowX;
      if (ox !== "auto" && ox !== "scroll") continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        const tag = `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(/\s+/).slice(0, 2).join(".")}` : ""}`;
        offenders.push(tag);
      }
    }
    return { docOverflow, offenders: offenders.slice(0, 8) };
  });
  expect(result.docOverflow).toBeLessThanOrEqual(1);
  expect(result.offenders, `overflow-x scroll containers: ${result.offenders.join(", ")}`).toEqual([]);
}

async function assertHorizontalScrollOptInAllowlist(page: Page, routeKey: string) {
  const count = await page.locator("[data-allow-horizontal-scroll='true']").count();
  const allowed = horizontalScrollAllowlist[routeKey] ?? 0;
  expect(count, `route ${routeKey}: ${count} opt-outs, allowed ${allowed}`).toBe(allowed);
}

async function assertMobileListCardsContained(page: Page) {
  const violations = await page.evaluate(() => {
    const lists = document.querySelectorAll<HTMLElement>("[data-mobile-list]");
    const out: string[] = [];
    lists.forEach((list, listIndex) => {
      const listRect = list.getBoundingClientRect();
      Array.from(list.children).forEach((card, cardIndex) => {
        if (!(card instanceof HTMLElement)) return;
        const cardRect = card.getBoundingClientRect();
        if (cardRect.left < listRect.left - 1 || cardRect.right > listRect.right + 1) {
          out.push(`list${listIndex}-card${cardIndex}: card [${cardRect.left.toFixed(0)},${cardRect.right.toFixed(0)}] vs list [${listRect.left.toFixed(0)},${listRect.right.toFixed(0)}]`);
        }
      });
    });
    return out;
  });
  expect(violations, violations.join("; ")).toEqual([]);
}

async function auditPage(page: Page, routeKey: string) {
  await assertNoHorizontalOverflow(page);
  await assertHorizontalScrollOptInAllowlist(page, routeKey);
  await assertMobileListCardsContained(page);
}

test.describe("no horizontal scroll", () => {
  test.setTimeout(120_000);
  test.beforeAll(() => {
    fs.mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });
  });

  for (const route of publicRoutes) {
    test(`public ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await auditPage(page, route);
    });
  }

  test.describe("authenticated admin", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDemo(page);
    });

    for (const route of adminRoutes) {
      test(`admin route ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: "networkidle" });
        await auditPage(page, route);
      });
    }

    test("modals and drawers", async ({ page }) => {
      await page.goto("/admin/configuracoes", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Definir horário de trabalho" }).click();
      await expect(page.getByRole("dialog", { name: /horários de atendimento/i })).toBeVisible();
      await auditPage(page, "/admin/configuracoes:work-hours");

      await page.getByRole("button", { name: "Fechar" }).click();

      await page.goto("/admin/pacientes/pat-ana", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Editar" }).click();
      await expect(page.getByRole("heading", { name: /editar paciente/i })).toBeVisible();
      await auditPage(page, "/admin/pacientes/pat-ana:edit-drawer");
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Novo atendimento" }).first().click();
      await expect(page.getByRole("heading", { name: /novo atendimento/i })).toBeVisible();
      await auditPage(page, "/admin/pacientes/pat-ana:schedule-drawer");
    });
  });
});
