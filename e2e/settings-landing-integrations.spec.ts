import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/settings-landing";

function parseRgb(color: string) {
  const match = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("settings integrations + landing CTA", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("configurações: e-mail inside integrações", async ({ page }) => {
    await loginAsDemo(page);
    await page.route("**/api/integrations/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          provider: null,
          connectedAddress: null,
          connectedAt: null,
          available: false,
          oauthAvailable: false,
          smtpAvailable: false,
        }),
      });
    });
    await page.route("**/api/integrations/google-calendar", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ available: false, settings: null }),
      });
    });

    await page.goto("/admin/configuracoes");
    await expect(page.getByText("Integrações", { exact: true })).toBeVisible();
    await expect(page.getByTestId("integration-google-calendar")).toBeVisible();
    await expect(page.getByTestId("integration-email")).toBeVisible();
    await expect(page.getByText("Integração ainda não disponível. O administrador da plataforma precisa concluir a configuração.")).toHaveCount(2);

    await page.screenshot({ path: path.join(artifactRoot, "settings-integrations.png"), fullPage: false });
  });

  test("landing final CTA heading contrast", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    const label = width >= 1200 ? "1280" : width >= 768 ? "768" : "390";
    test.skip(label === "768" && testInfo.project.name !== "desk-980", "tablet width project");
    test.skip(label === "1280" && testInfo.project.name !== "desktop-1280", "desktop width project");
    test.skip(label === "390" && testInfo.project.name !== "mobile-390", "mobile width project");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const accept = page.getByRole("button", { name: "Aceitar todos" });
    if (await accept.isVisible().catch(() => false)) await accept.click();

    const section = page.locator("#landing-final-cta");
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { name: /Pronto para organizar/i })).toBeVisible();

    const contrast = await section.evaluate(() => {
      const heading = document.querySelector("#landing-final-cta h2");
      const sectionEl = document.querySelector("#landing-final-cta");
      if (!heading || !sectionEl) return null;
      const fg = getComputedStyle(heading).color;
      const bg = getComputedStyle(sectionEl).backgroundColor;
      return { fg, bg };
    });

    expect(contrast).not.toBeNull();
    const fg = parseRgb(contrast!.fg);
    const bg = parseRgb(contrast!.bg);
    expect(fg).not.toBeNull();
    expect(bg).not.toBeNull();
    expect(contrastRatio(fg!, bg!)).toBeGreaterThanOrEqual(4.5);

    await page.screenshot({
      path: path.join(artifactRoot, `landing-final-cta-${label}.png`),
      fullPage: false,
    });
  });
});
