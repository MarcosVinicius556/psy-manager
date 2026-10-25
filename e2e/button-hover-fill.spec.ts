import { test, expect, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactRoot = "/opt/cursor/artifacts/screenshots/button-hover-fill";

type Rgb = { r: number; g: number; b: number; a: number };

function parseCssColor(color: string): Rgb | null {
  const rgba = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i);
  if (!rgba) return null;
  return {
    r: Number(rgba[1]),
    g: Number(rgba[2]),
    b: Number(rgba[3]),
    a: rgba[4] === undefined ? 1 : Number(rgba[4]),
  };
}

function colorsMatch(a: Rgb, b: Rgb, tolerance = 2) {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= 0.05
  );
}

async function expectFilledHoverGhost(locator: Locator) {
  const resting = await locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor };
  });

  const fill = parseCssColor(resting.background);
  expect(fill, `resting background: ${resting.background}`).not.toBeNull();
  expect(fill!.a).toBeGreaterThan(0.9);

  await locator.hover();

  const hovered = await locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      color: style.color,
    };
  });

  const hoverBg = parseCssColor(hovered.background);
  const hoverBorder = parseCssColor(hovered.border);
  const hoverText = parseCssColor(hovered.color);

  expect(hoverBg, `hover background: ${hovered.background}`).not.toBeNull();
  expect(hoverBg!.a).toBeLessThan(0.08);
  expect(hoverBorder, `hover border: ${hovered.border}`).not.toBeNull();
  expect(hoverText, `hover text: ${hovered.color}`).not.toBeNull();
  expect(colorsMatch(hoverBorder!, fill!)).toBe(true);
  expect(colorsMatch(hoverText!, fill!)).toBe(true);
}

test.describe("button hover — fill to transparent ghost", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("landing primary and secondary CTAs", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "desktop hover capture");
    await page.goto("/", { waitUntil: "networkidle" });

    const primary = page.locator(".landing .btn-primary").first();
    const secondary = page.locator(".landing .btn-text").first();

    await expectFilledHoverGhost(primary);
    await expectFilledHoverGhost(secondary);

    await primary.hover();
    await page.screenshot({ path: path.join(artifactRoot, "landing-primary-hover-1280.png"), fullPage: false });
  });
});
