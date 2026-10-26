import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactDir = path.join(process.cwd(), "artifacts", "o2-assinatura-pix");

async function screenshotPage(page: import("@playwright/test").Page, name: string) {
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: true });
}

test.describe("O2 assinatura Pix", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("tela Assinatura com checkout Pix (desktop e mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/assinatura");
    await expect(page.getByRole("heading", { name: "Assinatura" })).toBeVisible();
    await expect(page.getByText(/Assinatura por Pix/i)).toBeVisible();
    await screenshotPage(page, "assinatura-1280");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/assinatura");
    await expect(page.getByText(/Assinatura por Pix/i)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await screenshotPage(page, "assinatura-390");
  });
});
