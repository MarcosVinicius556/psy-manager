import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots";

test.describe("mobile bottom navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("tab labels stay visible and only one add FAB", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    if (width < 1024) {
      const routes = ["/admin", "/admin/agenda", "/admin/pacientes", "/admin/financeiro"];
      for (const route of routes) {
        await page.goto(route, { waitUntil: "networkidle" });
        const tabbar = page.locator("[data-testid='mobile-tabbar-shell']");
        await expect(tabbar).toBeVisible();
        for (const label of ["Início", "Agenda", "Pacientes", "Financeiro", "Menu"]) {
          const text = tabbar.getByText(label, { exact: true });
          await expect(text).toBeVisible();
          const box = await text.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.height).toBeGreaterThan(8);
          }
        }
        await expect(page.locator("[data-testid='mobile-tabbar-fab']")).toHaveCount(1);
        await expect(page.getByRole("button", { name: /Novo atendimento|Novo paciente|Novo lançamento|Agendar/i })).toHaveCount(0);
      }
    }
  });

  test("record tab bar spring navigation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-412", "animation capture on 412px");
    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.locator(".admin-tabbar a[href='/admin/agenda']").click();
    await page.waitForURL("**/admin/agenda**");
    await page.locator(".admin-tabbar a[href='/admin/pacientes']").click();
    await page.waitForURL("**/admin/pacientes**");
    await page.locator(".admin-tabbar a[href='/admin']").click();
    await page.waitForURL("**/admin");
  });

  test("Menu tab opens bottom sheet not side drawer", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 1024, "mobile only");
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page.locator("#admin-mobile-nav")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
    await page.getByTestId("mobile-tabbar-menu").click();
    const sheet = page.getByTestId("admin-mobile-menu-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Configurações" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Preferências de cookies" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
    await expect(sheet).toBeHidden();
  });

  test("capture mobile and desktop verification shots", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    const dir = path.join(artifactRoot, "nav-fix", testInfo.project.name);
    fs.mkdirSync(dir, { recursive: true });

    if (width === 412) {
      for (const [name, route] of [
        ["inicio", "/admin"],
        ["agenda", "/admin/agenda"],
        ["pacientes", "/admin/pacientes"],
        ["financeiro", "/admin/financeiro"],
      ] as const) {
        await page.goto(route, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(dir, `${name}-412.png`), fullPage: false });
      }
      await page.goto("/admin", { waitUntil: "networkidle" });
      await page.getByTestId("mobile-tabbar-menu").click();
      await expect(page.getByTestId("admin-mobile-menu-sheet")).toBeVisible();
      await page.screenshot({ path: path.join(dir, "menu-sheet-412.png"), fullPage: false });
    }

    if (width === 1440) {
      await page.goto("/admin", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(dir, "inicio-sidebar-1440.png"), fullPage: false });
      await page.goto("/admin/agenda", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(dir, "agenda-sidebar-1440.png"), fullPage: false });
    }
  });
});
