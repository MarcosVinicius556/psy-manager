import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactRoot = "/opt/cursor/artifacts/screenshots/platform";
const platformEmail = process.env.E2E_PLATFORM_EMAIL || "platform@psy.test";
const platformPassword = process.env.E2E_PLATFORM_PASSWORD || "Platform123456!";

async function loginPlatformOwner(page: Page) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Seu e-mail").fill(platformEmail);
  await page.getByPlaceholder("Sua senha").fill(platformPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("login"), {
    timeout: 90_000,
  });
  await page.goto("/plataforma", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Verificando o acesso da plataforma")).toHaveCount(0, { timeout: 60_000 });
}

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("platform shell", () => {
  test.beforeEach(async ({ page }) => {
    await loginPlatformOwner(page);
  });

  test("mobile uses floating tab bar without hamburger header", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 960, "mobile only");
    await expect(page.getByTestId("platform-mobile-tabbar-shell")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
    await expect(page.getByTestId("platform-mobile-tabbar-menu")).toBeVisible();
  });

  test("desktop uses floating sidebar rail", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 960, "desktop only");
    await expect(page.getByTestId("platform-desk-sidebar")).toBeVisible();
    await expect(page.getByTestId("platform-mobile-tabbar-shell")).toHaveCount(0);
  });

  test("menu sheet accordion opens one group", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) >= 960, "mobile only");
    await page.getByTestId("platform-mobile-tabbar-menu").click();
    await expect(page.getByTestId("platform-mobile-menu-sheet")).toBeVisible();
    const gestao = page.getByTestId("mobile-menu-group-Gestão");
    const operacao = page.getByTestId("mobile-menu-group-Operação");
    await gestao.getByRole("button").click();
    await expect(gestao.getByTestId("mobile-menu-group-panel-Gestão")).toBeVisible();
    await operacao.getByRole("button").click();
    await expect(operacao.getByTestId("mobile-menu-group-panel-Operação")).toBeVisible();
  });

  test("no horizontal overflow on key routes", async ({ page }) => {
    for (const route of ["/plataforma", "/plataforma/contas", "/plataforma/notificacoes", "/plataforma/auditoria"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      await assertNoHorizontalScroll(page);
    }
  });

  test("capture platform shell artifacts", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    if (width !== 390 && width !== 1280 && width !== 980) {
      test.skip();
      return;
    }
    fs.mkdirSync(artifactRoot, { recursive: true });
    const tag = String(width);

    await page.goto("/plataforma/notificacoes", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactRoot, `plataforma-notificacoes-${tag}.png`), fullPage: true });

    if (width < 960) {
      await page.screenshot({ path: path.join(artifactRoot, `plataforma-notificacoes-tabbar-${tag}.png`), fullPage: false });
    } else if (width === 1280) {
      const toggle = page.getByTestId("admin-sidebar-collapse-toggle");
      const aside = page.getByTestId("platform-desk-sidebar");
      if ((await aside.getAttribute("data-collapsed")) === "true") {
        await toggle.click();
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(artifactRoot, `plataforma-sidebar-expanded-${tag}.png`), fullPage: false });
    } else {
      await page.screenshot({ path: path.join(artifactRoot, `plataforma-sidebar-collapsed-${tag}.png`), fullPage: false });
    }

    await assertNoHorizontalScroll(page);
  });
});
