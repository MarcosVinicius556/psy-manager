import { expect, type Page } from "@playwright/test";

export const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
export const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";

async function dismissCookieBanner(page: Page) {
  const cookieBanner = page.getByTestId("cookie-banner");
  if (await cookieBanner.isVisible().catch(() => false)) {
    await cookieBanner.getByRole("button", { name: "Aceitar todos" }).click();
  }
}

async function waitForLoginForm(page: Page) {
  const email = page.locator('input[autocomplete="email"]');
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await email.isVisible().catch(() => false)) return email;
    const unavailable = page.getByRole("heading", { name: "Painel indisponível no momento" });
    if (await unavailable.isVisible().catch(() => false)) {
      const retry = page.getByRole("button", { name: "Tentar novamente" });
      if (await retry.isVisible().catch(() => false)) {
        await retry.click();
      } else {
        await page.reload({ waitUntil: "domcontentloaded" });
        await dismissCookieBanner(page);
      }
      await page.waitForTimeout(1200);
      continue;
    }
    await page.waitForTimeout(400);
  }
  await expect(email).toBeVisible({ timeout: 90_000 });
  return email;
}

export async function loginAsDemo(page: Page) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  const email = await waitForLoginForm(page);
  const password = page.locator('input[autocomplete="current-password"]');
  await email.fill(demoEmail);
  await password.fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), {
    timeout: 90_000,
  });

  const width = page.viewportSize()?.width ?? 1280;
  if (width < 768) {
    await expect(page.locator(".admin-tabbar")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId("mobile-tabbar-menu")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
  } else {
    await expect(page.getByTestId("admin-desk-sidebar")).toBeVisible({ timeout: 90_000 });
  }
}
