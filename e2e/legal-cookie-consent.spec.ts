import { test, expect } from "@playwright/test";

test.describe("cookie consent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.removeItem("psy-cookie-consent"));
  });

  test("aceitar todos persiste a escolha", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Aceitar todos" }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByTestId("cookie-banner")).toBeHidden();
    const stored = await page.evaluate(() => window.localStorage.getItem("psy-cookie-consent"));
    expect(stored).toContain('"analiticos":true');
  });

  test("rejeitar não necessários persiste", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cookie-banner").getByRole("button", { name: "Rejeitar não necessários" }).click();
    await page.reload();
    const stored = await page.evaluate(() => window.localStorage.getItem("psy-cookie-consent"));
    expect(stored).toContain('"analiticos":false');
    expect(stored).toContain('"funcionais":false');
  });

  test("configurar abre o painel de preferências", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cookie-banner").getByRole("button", { name: "Configurar" }).click();
    await expect(page.getByTestId("cookie-preferences-sheet")).toBeVisible();
  });
});
