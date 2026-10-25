import { test, expect, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/admin-sidebar";

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

function relativeLuminance({ r, g, b }: Rgb) {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

async function assertNoHarshNavBorder(rows: Locator) {
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
      const lum = relativeLuminance(rgb);
      expect(lum, `harsh border color: ${color}`).toBeGreaterThan(0.12);
    }
  }
}

async function expandSidebarIfCollapsed(page: Page) {
  const toggle = page.getByTestId("admin-sidebar-collapse-toggle");
  const aside = page.getByTestId("admin-desk-sidebar");
  const width = await aside.evaluate((el) => el.getBoundingClientRect().width);
  if (width < 120) {
    await toggle.click();
    await page.waitForTimeout(400);
  }
}

test.describe("admin desktop sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-desk-sidebar")).toBeVisible({ timeout: 60_000 });
  });

  test("active indicator moves between nav items", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 960, "desktop only");
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expandSidebarIfCollapsed(page);

    const pill = page.getByTestId("admin-sidebar-pill");
    await expect(pill).toHaveCount(1);
    const yBefore = await pill.evaluate((el) => el.getBoundingClientRect().top);

    await page.getByRole("link", { name: "Configurações" }).click();
    await page.waitForURL(/\/admin\/configuracoes/);
    await expect(pill).toHaveCount(1);
    const yAfter = await pill.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(yAfter - yBefore)).toBeGreaterThan(8);
  });

  test("accordion keeps only one group open", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 960, "desktop only");
    await page.goto("/admin/pacientes", { waitUntil: "domcontentloaded" });
    await expandSidebarIfCollapsed(page);

    const clinica = page.getByRole("button", { name: "Clínica" });
    const financeiro = page.getByRole("button", { name: "Financeiro" });
    await expect(clinica).toHaveAttribute("aria-expanded", "true");

    await financeiro.click();
    await expect(financeiro).toHaveAttribute("aria-expanded", "true");
    await expect(clinica).toHaveAttribute("aria-expanded", "false");
  });

  test("collapsed mode opens group flyout", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desk-980", "980px collapsed rail");
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    const aside = page.getByTestId("admin-desk-sidebar");
    const toggle = page.getByTestId("admin-sidebar-collapse-toggle");
    if ((await aside.getAttribute("data-collapsed")) !== "true") {
      await toggle.click();
      await expect(aside).toHaveAttribute("data-collapsed", "true", { timeout: 5_000 });
    }

    await page.getByRole("button", { name: "Clínica" }).click();
    const flyout = page.getByRole("menu", { name: "Clínica" });
    await expect(flyout).toBeVisible();
    await expect(flyout.getByRole("link", { name: "Agenda" })).toBeVisible();
  });

  test("nav rows avoid harsh dark borders", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 960, "desktop only");
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expandSidebarIfCollapsed(page);
    const rows = page.getByTestId("admin-desk-sidebar").locator("nav a, nav button");
    await assertNoHarshNavBorder(rows);
  });

  test("capture sidebar artifacts", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    if (width !== 1280 && width !== 980) {
      test.skip();
      return;
    }
    fs.mkdirSync(artifactRoot, { recursive: true });
    const tag = width === 1280 ? "1280" : "980";

    await page.goto("/admin/pacientes", { waitUntil: "networkidle" });

    if (width === 1280) {
      await expandSidebarIfCollapsed(page);
      await page.screenshot({ path: path.join(artifactRoot, `sidebar-expanded-${tag}.png`), fullPage: false });
      const legal = page.getByRole("button", { name: "Legal" });
      await legal.click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(artifactRoot, `sidebar-group-open-${tag}.png`), fullPage: false });
      await page.getByTestId("admin-sidebar-collapse-toggle").click();
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(artifactRoot, `sidebar-collapsed-${tag}.png`), fullPage: false });
      await page.getByRole("link", { name: "Início" }).hover();
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(artifactRoot, `sidebar-collapsed-tooltip-${tag}.png`), fullPage: false });
    } else {
      await page.getByRole("button", { name: "Financeiro" }).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(artifactRoot, `sidebar-collapsed-flyout-${tag}.png`), fullPage: false });
      await page.screenshot({ path: path.join(artifactRoot, `sidebar-collapsed-${tag}.png`), fullPage: false });
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
