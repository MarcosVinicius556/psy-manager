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
  const viewport = page.viewportSize()?.width ?? 0;
  if (viewport < 768) {
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible({ timeout: 90_000 });
    await expect(page.locator(".admin-tabbar")).toBeVisible({ timeout: 90_000 });
  } else {
    await expect(page.locator("aside.md\\:flex")).toBeVisible({ timeout: 90_000 });
  }
}
