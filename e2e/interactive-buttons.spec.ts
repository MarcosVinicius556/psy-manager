import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { demoEmail, demoPassword, loginAsDemo } from "./helpers/login";
import { expectReceivesPointerAtCenter } from "./helpers/hit-target";

const artifactRoot = "/opt/cursor/artifacts/screenshots/buttons-proof";

function attachPageErrorCollector(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message || String(error));
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

test.describe("interactive buttons — mobile and desktop", () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("landing Entrar navigates to login", async ({ page }, testInfo) => {
    const errors = attachPageErrorCollector(page);
    const width = testInfo.project.use.viewport?.width ?? 0;
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const entrar =
      width >= 1280
        ? page.getByRole("link", { name: "Entrar" }).first()
        : page.locator("#site-menu").getByRole("link", { name: "Entrar" });
    if (width < 1280) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(page.locator("#site-menu")).toHaveClass(/translate-x-0/);
      await page.waitForTimeout(320);
    }
    await expectReceivesPointerAtCenter(entrar);
    await entrar.click();
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test.describe("authenticated admin", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDemo(page);
    });

    test("pacientes FAB opens novo paciente dialog", async ({ page }, testInfo) => {
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin/pacientes", { waitUntil: "domcontentloaded" });
      const fab = page.getByRole("button", { name: "Novo paciente" });
      await expectReceivesPointerAtCenter(fab);
      await fab.click();
      await expect(page.getByRole("dialog", { name: /novo paciente/i })).toBeVisible();
      expect(errors, errors.join("\n")).toEqual([]);
      if (testInfo.project.name === "mobile-412") {
        await page.screenshot({ path: path.join(artifactRoot, "pacientes-sheet-412.png"), fullPage: true });
      }
    });

    test("financeiro filtros sheet opens on mobile", async ({ page }, testInfo) => {
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin/financeiro", { waitUntil: "domcontentloaded" });
      await page.getByRole("tab", { name: "Lançamentos" }).click();
      const isMobile = (testInfo.project.use.viewport?.width ?? 0) < 768;
      if (!isMobile) {
        test.skip();
        return;
      }
      const filtros = page.getByRole("button", { name: "Filtros" });
      await expectReceivesPointerAtCenter(filtros);
      await filtros.click();
      await expect(page.getByRole("dialog", { name: "Filtros do financeiro" })).toBeVisible();
      expect(errors, errors.join("\n")).toEqual([]);
      await page.screenshot({ path: path.join(artifactRoot, "financeiro-filtros-412.png"), fullPage: true });
    });

    test("mobile menu legal group collapsible", async ({ page }, testInfo) => {
      const isMobile = (testInfo.project.use.viewport?.width ?? 0) < 768;
      if (!isMobile) {
        test.skip();
        return;
      }
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin", { waitUntil: "domcontentloaded" });
      await page.getByTestId("mobile-tabbar-menu").click();
      const sheet = page.getByTestId("admin-mobile-menu-sheet");
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole("link", { name: "Termos de uso" })).toBeVisible();
      await expect(sheet.getByRole("button", { name: "Preferências de cookies" })).toBeVisible();
      await page.screenshot({ path: path.join(artifactRoot, "admin-menu-sheet-412.png"), fullPage: true });
      expect(errors, errors.join("\n")).toEqual([]);
    });

    test("mobile menu sheet opens and closes", async ({ page }, testInfo) => {
      const isMobile = (testInfo.project.use.viewport?.width ?? 0) < 1024;
      if (!isMobile) {
        test.skip();
        return;
      }
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin", { waitUntil: "domcontentloaded" });
      const menuBtn = page.getByTestId("mobile-tabbar-menu");
      await expectReceivesPointerAtCenter(menuBtn);
      await menuBtn.click();
      const sheet = page.getByTestId("admin-mobile-menu-sheet");
      await expect(sheet).toBeVisible();
      await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
      await expect(sheet).toBeHidden();
      const dashLink = page.locator(".admin-tabbar a[href='/admin']");
      await expectReceivesPointerAtCenter(dashLink);
      expect(errors, errors.join("\n")).toEqual([]);
    });

    test("desktop sidebar legal group expands", async ({ page }, testInfo) => {
      const isDesktop = (testInfo.project.use.viewport?.width ?? 0) >= 1024;
      if (!isDesktop) {
        test.skip();
        return;
      }
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin", { waitUntil: "domcontentloaded" });
      const legal = page.locator("aside.md\\:flex").getByRole("button", { name: "Legal" });
      await expect(legal).toHaveAttribute("aria-expanded", "false");
      await legal.click();
      await expect(legal).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: "Privacidade" })).toBeVisible();
      expect(errors, errors.join("\n")).toEqual([]);
    });

    test("desktop header action is clickable", async ({ page }, testInfo) => {
      const isDesktop = (testInfo.project.use.viewport?.width ?? 0) >= 1024;
      if (!isDesktop) {
        test.skip();
        return;
      }
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin/pacientes", { waitUntil: "domcontentloaded" });
      const novo = page.getByRole("button", { name: "Novo paciente" }).first();
      await expectReceivesPointerAtCenter(novo);
      await novo.click();
      await expect(page.getByRole("dialog", { name: /novo paciente/i })).toBeVisible();
      expect(errors, errors.join("\n")).toEqual([]);
    });
  });

  test("admin login form submits", async ({ page }) => {
    const errors = attachPageErrorCollector(page);
    await page.goto("/admin/login");
    await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
    await page.getByPlaceholder("Sua senha").fill(demoPassword);
    const submit = page.locator("form").getByRole("button", { name: "Entrar", exact: true });
    await expectReceivesPointerAtCenter(submit);
    await submit.click();
    await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), { timeout: 90_000 });
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
