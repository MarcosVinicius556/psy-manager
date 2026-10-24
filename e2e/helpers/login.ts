import { expect, type Page } from "@playwright/test";

export const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
export const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";

export async function loginAsDemo(page: Page) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  const email = page.locator('input[autocomplete="email"]');
  const password = page.locator('input[autocomplete="current-password"]');
  await expect(email).toBeVisible({ timeout: 90_000 });
  if (await page.getByRole("heading", { name: "Painel indisponível no momento" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(email).toBeVisible({ timeout: 90_000 });
  }
  await email.fill(demoEmail);
  await password.fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), {
    timeout: 90_000,
  });
  await expect(page.locator(".admin-tabbar")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByTestId("mobile-tabbar-menu")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
}
