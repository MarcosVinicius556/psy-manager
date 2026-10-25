import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/design-system-390";

const adminListingRoutes = [
  { name: "pacientes", path: "/admin/pacientes" },
  { name: "pacotes", path: "/admin/pacotes" },
  { name: "agenda", path: "/admin/agenda" },
  { name: "financeiro", path: "/admin/financeiro" },
  { name: "relatorios", path: "/admin/operacional/relatorios" },
  { name: "locais", path: "/admin/locais" },
  { name: "notificacoes", path: "/admin/notificacoes" },
  { name: "contratos", path: "/admin/operacional/contrato" },
  { name: "receita-saude", path: "/admin/financeiro/receita-saude" },
  { name: "inicio", path: "/admin" },
] as const;

test.describe("design system — mobile listing screenshots (390px)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "390px listing captures only");
    await loginAsDemo(page);
  });

  for (const route of adminListingRoutes) {
    test(`listing ${route.name}`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      if (route.name === "financeiro") {
        await page.getByRole("tab", { name: "Lançamentos" }).click();
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await page.screenshot({ path: path.join(artifactRoot, `listing-${route.name}.png`), fullPage: true });
    });
  }

  test("listing paciente prontuario timeline", async ({ page }) => {
    await page.goto("/admin/pacientes/pat-ana", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactRoot, "listing-paciente-prontuario.png"), fullPage: true });
  });

  test("listing paciente feedbacks", async ({ page }) => {
    await page.goto("/admin/pacientes/pat-ana", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Agenda" }).click();
    await page.screenshot({ path: path.join(artifactRoot, "listing-paciente-agenda-feedbacks.png"), fullPage: true });
  });

  test("menu sheet open", async ({ page }) => {
    await page.goto("/admin/pacientes", { waitUntil: "networkidle" });
    await page.getByTestId("mobile-tabbar-menu").click();
    await expect(page.getByTestId("admin-mobile-menu-sheet")).toBeVisible();
    await page.getByTestId("mobile-menu-group-Clínica").getByRole("button").click();
    await page.screenshot({ path: path.join(artifactRoot, "menu-sheet-expanded.png"), fullPage: false });
  });

  test("landing hero", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactRoot, "landing-hero.png"), fullPage: false });
  });

  test("desktop primary button hover", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "desktop hover capture");
    await page.goto("/", { waitUntil: "networkidle" });
    const cta = page.getByRole("link", { name: "Testar grátis" }).first();
    await cta.hover();
    await page.screenshot({ path: path.join(artifactRoot, "landing-primary-hover-1280.png"), fullPage: false });
  });
});
