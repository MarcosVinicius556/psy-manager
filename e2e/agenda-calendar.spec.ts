import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";
import { expectReceivesPointerAtCenter } from "./helpers/hit-target";
import { formatDate, shiftDate, todayISO } from "../src/lib/admin/format";

const artifactRoot = "/opt/cursor/artifacts/screenshots/agenda-proof";

test.describe("agenda calendar mobile", () => {
  test.setTimeout(120_000);

  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-412", "agenda mobile screenshots on 412px only");
    await loginAsDemo(page);
    await page.goto("/admin/agenda", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: "Hoje" })).toBeVisible();
  });

  async function shot(page: import("@playwright/test").Page, name: string) {
    await page.screenshot({ path: path.join(artifactRoot, name), fullPage: true });
  }

  test("Hoje view — week strip fits without horizontal scroll", async ({ page }) => {
    await page.getByRole("tab", { name: "Hoje" }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const strip = page.locator("[data-day-strip]");
    await expect(strip).toBeVisible();
    const stripOverflow = await strip.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(stripOverflow).toBeLessThanOrEqual(1);
    await shot(page, "agenda-hoje-412.png");
  });

  test("selecting another day updates card date", async ({ page }) => {
    await page.getByRole("tab", { name: "Hoje" }).click();
    const today = todayISO();
    const other = shiftDate(today, 1);
    const dayBtn = page.locator(`[data-day-strip] button[data-day="${other}"]`);
    await expect(dayBtn).toBeVisible();
    await expectReceivesPointerAtCenter(dayBtn);
    await dayBtn.click();
    await expect(dayBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-agenda-selected-date]")).toHaveText(formatDate(other));
    await shot(page, "agenda-day-selected-412.png");
  });

  test("Semana and Mês views screenshot", async ({ page }) => {
    await page.getByRole("tab", { name: "Semana" }).click();
    await expect(page.locator("[data-day-strip]")).toBeVisible();
    await shot(page, "agenda-semana-412.png");

    await page.getByRole("tab", { name: "Mês" }).click();
    await expect(page.locator("[data-agenda-day-card]")).toBeHidden();
    await expect(page.getByRole("button", { name: /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i }).first()).toBeVisible();
    await shot(page, "agenda-mes-412.png");
  });
});
