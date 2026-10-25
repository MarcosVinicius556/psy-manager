import { test, expect } from "@playwright/test";

const unknownRoute = "/rota-inexistente-psy-manager-404-e2e";

async function expect404BelowLandingHeader(page: import("@playwright/test").Page) {
  const layout = await page.evaluate(() => {
    const header = document.querySelector("header.landing");
    const fourOhFour = document.querySelector("main p[aria-hidden='true']");
    if (!header || !fourOhFour) return null;
    const headerBottom = header.getBoundingClientRect().bottom;
    const fourOhFourTop = fourOhFour.getBoundingClientRect().top;
    return { headerBottom, fourOhFourTop, gap: fourOhFourTop - headerBottom };
  });
  expect(layout).not.toBeNull();
  expect(layout!.gap).toBeGreaterThanOrEqual(4);
  expect(layout!.fourOhFourTop).toBeGreaterThanOrEqual(layout!.headerBottom);
}

test.describe("404 not found page", () => {
  test("shows heading and primary action on unknown route", async ({ page }) => {
    const response = await page.goto(unknownRoute, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Parece que você se perdeu" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar ao início" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
    await expect(page.getByRole("img", { name: /homem das cavernas/i })).toBeVisible();
  });

  test("404 heading stays below fixed landing header", async ({ page }) => {
    const viewports = [
      { width: 1280, height: 720 },
      { width: 1280, height: 576 },
      { width: 1024, height: 576 },
      { width: 390, height: 844 },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(unknownRoute, { waitUntil: "domcontentloaded" });
      await expect404BelowLandingHeader(page);
    }
  });

  test("jump peak does not overlap landing header at 1280", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(unknownRoute, { waitUntil: "domcontentloaded" });
    const interactive = page.locator(".cave-404-interactive--playful");
    await interactive.hover();
    await page.waitForTimeout(180);
    const overlap = await page.evaluate(() => {
      const header = document.querySelector("header.landing");
      const figure = document.querySelector(".cave-404__figure");
      if (!header || !figure) return { ok: false };
      const headerBottom = header.getBoundingClientRect().bottom;
      const figureTop = figure.getBoundingClientRect().top;
      return { ok: figureTop >= headerBottom - 2, headerBottom, figureTop };
    });
    expect(overlap.ok).toBe(true);
  });
});
