import { test, expect } from "@playwright/test";

const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";

const loggedOutRoutes = [
  "/admin/login",
  "/cadastro",
] as const;

const loggedInRoutes = [
  "/admin",
  "/admin/agenda",
  "/admin/pacientes",
  "/admin/financeiro",
  "/admin/pacientes/pat-ana",
  "/admin/configuracoes",
] as const;

function attachPageErrorCollector(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message || String(error));
  });
  return errors;
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

  test.describe("logged in", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/login");
      await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
      await page.getByPlaceholder("Sua senha").fill(demoPassword);
      await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("login"), { timeout: 60_000 });
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
});
