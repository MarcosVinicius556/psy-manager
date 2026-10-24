import { expect, type Page } from "@playwright/test";

export const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
export const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";

export async function loginAsDemo(page: Page) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
  await page.getByPlaceholder("Sua senha").fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), {
    timeout: 90_000,
  });
  const mobileMenu = page.getByRole("button", { name: "Abrir menu" });
  const desktopHome = page.getByRole("link", { name: "Início" }).first();
  await expect(mobileMenu.or(desktopHome)).toBeVisible({ timeout: 90_000 });
}
