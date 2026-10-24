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

  test("painel de preferências não fica sob o header da landing", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cookie-banner").getByRole("button", { name: "Configurar" }).click();
    const title = page.getByRole("heading", { name: "Preferências de cookies" });
    await expect(title).toBeVisible();
    const coveredByHeader = await title.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + Math.min(rect.width * 0.15, 24);
      const y = rect.top + rect.height / 2;
      const top = document.elementFromPoint(x, y);
      if (!top) return true;
      return Boolean(top.closest("header.landing"));
    });
    expect(coveredByHeader).toBe(false);
  });

  test("ações do banner e do painel têm altura mínima de toque", async ({ page }) => {
    await page.goto("/");
    const accept = page.getByTestId("cookie-accept-all");
    const reject = page.getByTestId("cookie-reject");
    for (const button of [accept, reject]) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId("cookie-banner").getByRole("button", { name: "Configurar" }).click();
    const save = page.getByTestId("cookie-save-preferences");
    const saveBox = await save.boundingBox();
    expect(saveBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("painel sem rolagem horizontal", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cookie-banner").getByRole("button", { name: "Configurar" }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
