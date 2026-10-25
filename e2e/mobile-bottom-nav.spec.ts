import { test, expect, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots";

const tabLabels = ["Início", "Agenda", "Pacientes", "Menu"] as const;

async function assertTabLabelsVisible(tabbar: Locator) {
  for (const label of tabLabels) {
    const text = tabbar.getByText(label, { exact: true });
    await expect(text).toBeVisible();
    const box = await text.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThan(8);
    }
  }
}

test.describe("mobile bottom navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("tab labels stay visible, FAB centered, Financeiro in menu sheet", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    if (width >= 960) return;

    const routes = ["/admin", "/admin/agenda", "/admin/pacientes", "/admin/financeiro"];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });
      const tabbar = page.locator("[data-testid='mobile-tabbar-shell']");
      await expect(tabbar).toBeVisible();
      await assertTabLabelsVisible(tabbar);

      const fab = page.locator("[data-testid='mobile-tabbar-fab']");
      await expect(fab).toHaveCount(1);
      const fabBox = await fab.boundingBox();
      expect(fabBox).not.toBeNull();
      if (fabBox) {
        const centerX = fabBox.x + fabBox.width / 2;
        expect(Math.abs(centerX - width / 2)).toBeLessThanOrEqual(1);
      }

      await expect(page.getByRole("button", { name: /Novo atendimento|Novo paciente|Novo lançamento|Agendar/i })).toHaveCount(0);
    }

    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.getByTestId("mobile-tabbar-menu").click();
    const sheet = page.getByTestId("admin-mobile-menu-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Contas a receber" })).toBeVisible();
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
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 960, "mobile only");
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page.locator("#admin-mobile-nav")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
    await page.getByTestId("mobile-tabbar-menu").click();
    const sheet = page.getByTestId("admin-mobile-menu-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Configurações" })).toBeVisible();
    await page.getByTestId("mobile-menu-group-Legal").getByRole("button").click();
    await expect(sheet.getByRole("button", { name: "Preferências de cookies" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
    await expect(sheet).toBeHidden();
  });

  test("menu sheet items are left-aligned and accordion keeps one group open", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 960, "mobile only");
    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.getByTestId("mobile-tabbar-menu").click();
    const sheet = page.getByTestId("admin-mobile-menu-sheet");
    const scroll = page.getByTestId("mobile-menu-scroll");
    const scrollBox = await scroll.boundingBox();
    const item = sheet.getByTestId("mobile-menu-item").first();
    await expect(item).toBeVisible();
    const itemBox = await item.boundingBox();
    expect(scrollBox).not.toBeNull();
    expect(itemBox).not.toBeNull();
    if (scrollBox && itemBox) {
      expect(Math.abs(itemBox.x - scrollBox.x)).toBeLessThanOrEqual(4);
    }

    const clinicaPanel = page.getByTestId("mobile-menu-group-panel-Clínica");
    const financeiroPanel = page.getByTestId("mobile-menu-group-panel-Financeiro");
    await page.getByTestId("mobile-menu-group-Clínica").getByRole("button").click();
    await expect(clinicaPanel).toBeVisible();
    await page.getByTestId("mobile-menu-group-Financeiro").getByRole("button").click();
    await expect(financeiroPanel).toBeVisible();
    await expect(clinicaPanel).toBeHidden();
  });

  test("dashboard active patients count is stable after refresh", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 960, "mobile only");
    await page.goto("/admin", { waitUntil: "networkidle" });
    const count = page.getByTestId("dashboard-active-patients-count");
    await expect(count).toBeVisible();
    await expect(count).toHaveText(/\d+/);
    const initial = (await count.textContent())?.trim() ?? "";
    expect(Number(initial)).toBeGreaterThan(0);

    await page.waitForTimeout(900);
    await expect(count).toHaveText(initial);

    await page.reload({ waitUntil: "networkidle" });
    await expect(count).toHaveText(/\d+/);
    expect(Number((await count.textContent())?.trim() ?? "0")).toBeGreaterThan(0);
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
      await page.getByTestId("mobile-menu-group-Financeiro").getByRole("button").click();
      await page.screenshot({ path: path.join(dir, "menu-sheet-412.png"), fullPage: false });
      await page.screenshot({ path: path.join(artifactRoot, "mobile-menu-sheet-after-412.png"), fullPage: false });
      await page.screenshot({ path: path.join(artifactRoot, "mobile-bottom-nav-after-412.png"), fullPage: false });
    }

    if (width === 360) {
      await page.goto("/admin", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(artifactRoot, "dashboard-inicio-after-360.png"), fullPage: false });
    }

    if (width === 1440) {
      await page.goto("/admin", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(dir, "inicio-sidebar-1440.png"), fullPage: false });
      await page.goto("/admin/agenda", { waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(dir, "agenda-sidebar-1440.png"), fullPage: false });
    }
  });
});
