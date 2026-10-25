import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/design-system-390";

test.describe("admin desk breakpoint (960px)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("980px shows desktop sidebar, not mobile tab bar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desk-980", "980px project only");
    await page.goto("/admin/pacientes", { waitUntil: "networkidle" });
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("[data-testid='mobile-tabbar-shell']")).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    fs.mkdirSync(artifactRoot, { recursive: true });
    await page.screenshot({ path: path.join(artifactRoot, "desk-sidebar-980.png"), fullPage: false });
  });

  test("959px shows mobile tab bar, not desktop sidebar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-959", "959px project only");
    await page.goto("/admin/pacientes", { waitUntil: "networkidle" });
    await expect(page.locator("[data-testid='mobile-tabbar-shell']")).toBeVisible();
    await expect(page.locator("aside")).toBeHidden();
  });
});
