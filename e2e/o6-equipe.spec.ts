import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/o6-equipe";

const screens = [
  { name: "equipe-secretarias", path: "/admin/equipe" },
  { name: "equipe-supervisao", path: "/admin/equipe/supervisao" },
] as const;

test.describe("O6 equipe screens", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  for (const width of [1280, 390] as const) {
    for (const screen of screens) {
      test(`${screen.name} @ ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(screen.path, { waitUntil: "networkidle" });
        await expect(page.locator("body")).toBeVisible();
        await page.screenshot({
          path: path.join(artifactRoot, `${screen.name}-${width}.png`),
          fullPage: true,
        });
      });
    }
  }
});
