import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactRoot = path.join("artifacts", "screenshots", "landing-redesign");

test.describe("landing redesign sections", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("key sections and anchors render", async ({ page }, testInfo) => {
    const isMobile = (testInfo.project.use.viewport?.width ?? 0) < 500;
    const prefix = isMobile ? "mobile-412" : "desktop-1440";

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toContainText("consultório organizado");

    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-hero.png`),
      fullPage: false,
    });

    await page.locator("#funcionalidades").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-funcionalidades.png`),
      fullPage: false,
    });

    await page.locator("#seguranca").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-seguranca.png`),
      fullPage: false,
    });

    await page.locator("#planos").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-planos.png`),
      fullPage: false,
    });

    await page.locator("#faq").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-faq.png`),
      fullPage: false,
    });

    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(docWidth).toBeLessThanOrEqual(viewWidth + 2);
  });
});
