import { test, expect } from "@playwright/test";

const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const platformEmail = process.env.E2E_PLATFORM_EMAIL || "platform@psy.test";
const platformPassword = process.env.E2E_PLATFORM_PASSWORD || "Platform123456!";

const loggedOutRoutes = ["/admin/login", "/cadastro"] as const;

const loggedInRoutes = [
  "/admin",
  "/admin/agenda",
  "/admin/pacientes",
  "/admin/financeiro",
  "/admin/pacientes/pat-ana",
  "/admin/configuracoes",
] as const;

const platformRoutes = [
  "/plataforma",
  "/plataforma/contas",
  "/plataforma/planos",
  "/plataforma/notificacoes",
  "/plataforma/auditoria",
] as const;

function attachPageErrorCollector(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message || String(error));
  });
  return errors;
}

async function assertNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function loginDemo(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
  await page.getByPlaceholder("Sua senha").fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("login"), { timeout: 60_000 });
}

async function loginPlatformOwner(page: import("@playwright/test").Page) {
  await page.goto("/plataforma/login");
  await page.getByLabel("E-mail").fill(platformEmail);
  await page.getByLabel("Senha").fill(platformPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/plataforma", { timeout: 60_000 });
}

test.describe("platform routes — no client exceptions", () => {
  for (const route of loggedOutRoutes) {
    test(`logged out ${route}`, async ({ page }) => {
      const errors = attachPageErrorCollector(page);
      await page.goto(route, { waitUntil: "load" });
      await page.waitForTimeout(500);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }

  test.describe("logged in clinic", () => {
    test.beforeEach(async ({ page }) => {
      await loginDemo(page);
    });

    for (const route of loggedInRoutes) {
      test(`logged in ${route}`, async ({ page }) => {
        const errors = attachPageErrorCollector(page);
        await page.goto(route, { waitUntil: "load" });
        await page.waitForTimeout(800);
        expect(errors, errors.join("\n")).toEqual([]);
      });
    }
  });

  test.describe("super_admin plataforma", () => {
    test.beforeEach(async ({ page }) => {
      await loginPlatformOwner(page);
    });

    test("menu Plataforma from admin", async ({ page }) => {
      const errors = attachPageErrorCollector(page);
      await page.goto("/admin/login");
      await page.getByPlaceholder("Seu e-mail").fill(platformEmail);
      await page.getByPlaceholder("Sua senha").fill(platformPassword);
      await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("login"), { timeout: 60_000 });
      await page.getByRole("link", { name: "Plataforma" }).click();
      await page.waitForURL("**/plataforma**", { timeout: 60_000 });
      await page.waitForTimeout(800);
      expect(errors, errors.join("\n")).toEqual([]);
      await expect(page).not.toHaveURL(/login/);
    });

    for (const route of platformRoutes) {
      test(`route ${route} no pageerror`, async ({ page }) => {
        const errors = attachPageErrorCollector(page);
        await page.goto(route, { waitUntil: "load" });
        await page.waitForTimeout(800);
        expect(errors, errors.join("\n")).toEqual([]);
        await expect(page).not.toHaveURL(/login/);
      });

      test(`route ${route} no horizontal overflow`, async ({ page }) => {
        await page.goto(route, { waitUntil: "load" });
        await page.waitForTimeout(500);
        await assertNoHorizontalScroll(page);
      });
    }
  });
});
