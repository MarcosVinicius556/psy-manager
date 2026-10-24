import { test, expect } from "@playwright/test";

import { loginAsDemo } from "./helpers/login";

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
      await loginAsDemo(page);
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
