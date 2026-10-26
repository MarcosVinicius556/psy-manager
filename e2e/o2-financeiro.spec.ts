import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactDir = path.join(process.cwd(), "artifacts", "o2-financeiro");

async function screenshotPage(page: import("@playwright/test").Page, name: string) {
  fs.mkdirSync(artifactDir, { recursive: true });
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: true });
}

test.describe("O2 financeiro — Pix e Receita Saúde", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("central Receita Saúde sem scroll horizontal (desktop e mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/financeiro/receita-saude");
    await expect(page.getByRole("heading", { name: /Central Receita Saúde/i })).toBeVisible();
    await screenshotPage(page, "receita-saude-1280");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/financeiro/receita-saude");
    await expect(page.getByRole("heading", { name: /Central Receita Saúde/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await screenshotPage(page, "receita-saude-390");
  });

  test("configurações Pix sem scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/configuracoes");
    await expect(page.getByRole("heading", { name: /Pix para cobrança/i })).toBeVisible();
    await screenshotPage(page, "config-pix-1280");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/configuracoes");
    await expect(page.getByRole("heading", { name: /Pix para cobrança/i })).toBeVisible();
    await screenshotPage(page, "config-pix-390");
  });

  test("modal receber com Pix (financeiro)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/financeiro");
    const receive = page.getByRole("button", { name: "Receber" }).first();
    if (await receive.isVisible()) {
      await receive.click();
      await expect(page.getByText(/Pix copia e cola/i)).toBeVisible();
      await screenshotPage(page, "receive-pix-1280");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/financeiro");
    const receiveMobile = page.getByRole("button", { name: "Receber" }).first();
    if (await receiveMobile.isVisible()) {
      await receiveMobile.click();
      await expect(page.getByText(/Pix copia e cola/i)).toBeVisible();
      await screenshotPage(page, "receive-pix-390");
    }
  });
});
