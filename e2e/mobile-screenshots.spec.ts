import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const publicScreens = [
  { name: "landing", path: "/" },
  { name: "admin-login", path: "/admin/login" },
  { name: "plataforma-login", path: "/plataforma/login" },
] as const;

const authScreens = [
  { name: "admin-dashboard", path: "/admin" },
  { name: "admin-agenda", path: "/admin/agenda" },
  { name: "admin-pacientes", path: "/admin/pacientes" },
  { name: "admin-financeiro", path: "/admin/financeiro" },
  { name: "admin-configuracoes", path: "/admin/configuracoes" },
] as const;

const artifactRoot = "/opt/cursor/artifacts/screenshots";

function shotDir(projectName: string, phase: "after") {
  return path.join(artifactRoot, phase, projectName);
}

async function assertNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("mobile UX screenshots (after)", () => {
  test.setTimeout(120_000);
  test.beforeAll(() => {
    fs.mkdirSync(path.join(artifactRoot, "after"), { recursive: true });
  });

  for (const screen of publicScreens) {
    test(`public ${screen.name}`, async ({ page }, testInfo) => {
      await page.goto(screen.path, { waitUntil: "networkidle" });
      await assertNoHorizontalScroll(page);
      const dir = shotDir(testInfo.project.name, "after");
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, `${screen.name}.png`), fullPage: true });

      if (screen.name === "admin-login") {
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
      }
    });
  }

  test.describe("authenticated panel", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDemo(page);
    });

    for (const screen of authScreens) {
      test(`auth ${screen.name}`, async ({ page }, testInfo) => {
        await page.goto(screen.path, { waitUntil: "networkidle" });
        await assertNoHorizontalScroll(page);
        const dir = shotDir(testInfo.project.name, "after");
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${screen.name}.png`), fullPage: true });
      });
    }

    test("auth dashboard widgets scroll", async ({ page }, testInfo) => {
      if (testInfo.project.name !== "mobile-412") return;
      await page.goto("/admin", { waitUntil: "networkidle" });
      await page.getByText("Lançamentos futuros").scrollIntoViewIfNeeded();
      const dir = shotDir(testInfo.project.name, "after");
      await page.screenshot({ path: path.join(dir, "admin-dashboard-widgets.png"), fullPage: false });
      await page.getByText("Não pagaram").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(dir, "admin-dashboard-debtors.png"), fullPage: false });
    });

    test("auth mobile duplicate primary actions", async ({ page }, testInfo) => {
      if (testInfo.project.name !== "mobile-412") return;
      await page.goto("/admin/pacientes", { waitUntil: "networkidle" });
      await expect(page.locator(".admin-desktop-only .btn-primary")).toBeHidden();
      await expect(page.getByRole("button", { name: "Novo paciente", exact: true })).toHaveCount(1);
      await page.goto("/admin/financeiro", { waitUntil: "networkidle" });
      await expect(page.locator(".admin-desktop-only .btn-primary")).toBeHidden();
      await expect(page.getByRole("button", { name: "Novo lançamento", exact: true })).toHaveCount(1);
    });

    test("auth paciente detalhe + axe financeiro", async ({ page }, testInfo) => {
      await page.goto("/admin/pacientes/pat-ana");
      await page.waitForURL("**/admin/pacientes/pat-ana**");
      await assertNoHorizontalScroll(page);
      const dir = shotDir(testInfo.project.name, "after");
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, "admin-paciente-detalhe.png"), fullPage: true });

      await page.goto("/admin/financeiro");
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
    });
  });
});
