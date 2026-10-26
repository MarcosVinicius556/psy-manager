import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactRoot = path.join("artifacts", "screenshots", "landing-redesign");

async function acceptCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

test.describe("landing conversion sections", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("key sections, real screenshots and anchors", async ({ page }, testInfo) => {
    const isMobile = (testInfo.project.use.viewport?.width ?? 0) < 500;
    const prefix = isMobile ? "mobile-412" : "desktop-1440";

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await acceptCookies(page);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("consultório organizado");

    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-hero.png`),
      fullPage: false,
    });

    await page.locator("#funcionalidades").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /Veja o painel/i })).toBeVisible();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-funcionalidades.png`),
      fullPage: false,
    });

    await page.locator("#seguranca").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /Dados clínicos ficam/i })).toBeVisible();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-seguranca.png`),
      fullPage: false,
    });

    await page.locator("#planos").scrollIntoViewIfNeeded();
    await expect(page.getByText(/R\$\s*89,90|89,90/)).toBeVisible();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-planos.png`),
      fullPage: false,
    });

    await page.locator("#faq").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(artifactRoot, `${prefix}-faq.png`),
      fullPage: false,
    });

    const heroImages = page.locator("#inicio img");
    await expect(heroImages.first()).toBeVisible();
    const src = await heroImages.first().getAttribute("src");
    expect(decodeURIComponent(src || "")).toMatch(/landing\/[^"&?]+\.webp/);

    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(docWidth).toBeLessThanOrEqual(viewWidth + 2);
  });
});
