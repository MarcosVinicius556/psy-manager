import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function shotDir(projectName: string) {
  return path.join("artifacts", "screenshots", "after", projectName, "landing-header");
}

test.describe("landing header mobile + desktop", () => {
  test.beforeAll(() => {
    fs.mkdirSync(path.join("artifacts", "screenshots", "after"), { recursive: true });
  });

  test("hero and menu states", async ({ page }, testInfo) => {
    const dir = shotDir(testInfo.project.name);
    fs.mkdirSync(dir, { recursive: true });

    await page.goto("/", { waitUntil: "networkidle" });

    await page.screenshot({ path: path.join(dir, "menu-closed.png"), fullPage: false });

    const entrarHero = page.getByRole("link", { name: "Já tem uma conta? Entrar" });
    await expect(entrarHero).toBeVisible();

    await entrarHero.hover();
    await page.screenshot({ path: path.join(dir, "hero-entrar-hover.png"), fullPage: false });
    await entrarHero.focus();
    await page.screenshot({ path: path.join(dir, "hero-entrar-focus.png"), fullPage: false });

    const isMobile = testInfo.project.name.startsWith("mobile-");
    if (isMobile) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      const menu = page.locator("#site-menu");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("link", { name: "Produto" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "Recursos" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "Valores" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "Perguntas" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
      await expect(menu.getByRole("link", { name: "Começar gratuitamente" })).toBeVisible();

      const menuBox = await menu.boundingBox();
      expect(menuBox?.height ?? 0).toBeGreaterThan(280);

      await page.screenshot({ path: path.join(dir, "menu-open.png"), fullPage: false });

      await menu.getByRole("link", { name: "Entrar", exact: true }).hover();
      await page.screenshot({ path: path.join(dir, "menu-entrar-hover.png"), fullPage: false });
    } else {
      const headerEntrar = page.locator("header").getByRole("link", { name: "Entrar", exact: true });
      await headerEntrar.hover();
      await page.screenshot({ path: path.join(dir, "header-entrar-hover.png"), fullPage: false });
    }
  });
});
