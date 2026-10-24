import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";

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

function shotDir(projectName: string, phase: "after") {
  return path.join("artifacts", "screenshots", phase, projectName);
}

async function assertNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("mobile UX screenshots (after)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(path.join("artifacts", "screenshots", "after"), { recursive: true });
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
      await page.goto("/admin/login");
      await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
      await page.getByPlaceholder("Sua senha").fill(demoPassword);
      await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL("**/admin**", { timeout: 60_000 });
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
