import { test, expect, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/menu-sheet-borders";

type Rgb = { r: number; g: number; b: number; a: number };

function parseCssColor(color: string): Rgb | null {
  const rgba = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i);
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }
  return null;
}

/** Relative luminance (sRGB), 0 = black, 1 = white. */
function relativeLuminance({ r, g, b }: Rgb) {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

async function assertNoHarshRowBorder(rows: Locator) {
  const results = await rows.evaluateAll((nodes) =>
    nodes.map((el) => {
      const style = getComputedStyle(el);
      const sides = ["Top", "Right", "Bottom", "Left"] as const;
      return sides.map((side) => ({
        width: parseFloat(style[`border${side}Width` as keyof CSSStyleDeclaration] as string) || 0,
        color: style[`border${side}Color` as keyof CSSStyleDeclaration] as string,
      }));
    })
  );

  for (const borders of results) {
    for (const { width, color } of borders) {
      if (width <= 0) continue;
      const rgb = parseCssColor(color);
      expect(rgb, `unparsed border color: ${color}`).not.toBeNull();
      if (!rgb) continue;
      expect(rgb.a, `unexpected opaque dark border: ${color}`).toBeLessThan(0.08);
      if (rgb.a >= 0.08) {
        expect(relativeLuminance(rgb), `dark menu row border: ${color}`).toBeGreaterThan(0.82);
      }
    }
  }
}

async function openMenuSheet(page: Page) {
  await page.getByTestId("mobile-tabbar-menu").click();
  await expect(page.getByTestId("admin-mobile-menu-sheet")).toBeVisible();
}

test.describe("menu sheet — no harsh row borders", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "390px menu border checks");
    await loginAsDemo(page);
  });

  test("menu rows have no dark outline", async ({ page }) => {
    await page.goto("/admin/pacientes", { waitUntil: "networkidle" });
    await openMenuSheet(page);

    const menuRows = page
      .locator("#admin-mobile-menu-sheet [data-testid='mobile-menu-item']")
      .or(page.locator("#admin-mobile-menu-sheet [data-testid^='mobile-menu-group-'] > button"))
      .or(page.getByTestId("admin-mobile-menu-sheet").getByRole("button", { name: "Sair" }));

    await assertNoHarshRowBorder(menuRows);

    await page.getByTestId("mobile-menu-group-Clínica").getByRole("button").click();
    await assertNoHarshRowBorder(menuRows);
  });

  test("screenshots — menu, pacientes, início, pacotes (390px)", async ({ page }) => {
    await page.goto("/admin/pacientes", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactRoot, "pacientes-390.png"), fullPage: true });

    await openMenuSheet(page);
    await page.screenshot({ path: path.join(artifactRoot, "menu-sheet-390.png"), fullPage: false });
    await page.getByRole("button", { name: "Fechar menu" }).first().click();

    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactRoot, "inicio-390.png"), fullPage: true });

    await page.goto("/admin/pacotes", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactRoot, "pacotes-390.png"), fullPage: true });
  });
});

test.describe("início desktop screenshot (1280px)", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("início at desk width", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "1280px capture only");
    await loginAsDemo(page);
    await page.goto("/admin", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactRoot, "inicio-1280.png"), fullPage: true });
  });
});
