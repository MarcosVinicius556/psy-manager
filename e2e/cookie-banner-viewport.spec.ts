import { test, expect } from "@playwright/test";

test.describe("cookie banner viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.localStorage.removeItem("psy-cookie-consent"));
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("banner fits inside viewport on desktop widths", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    test.skip(width < 960 || width > 1440, "desk band");

    const banner = page.getByTestId("cookie-banner");
    await expect(banner).toBeVisible();
    const box = await banner.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(box.width).toBeGreaterThan(200);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
