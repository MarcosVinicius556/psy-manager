import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifactRoot = path.join("artifacts", "screenshots", "o1-commercial");

async function acceptCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

test.describe("O1 commercial surfaces", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test("planos and conteudos at desktop and mobile widths", async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 1280;
    const tag = width < 500 ? "390" : "1280";

    await page.goto("/planos", { waitUntil: "domcontentloaded" });
    await acceptCookies(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("tudo incluso");
    await page.screenshot({ path: path.join(artifactRoot, `planos-${tag}.png`), fullPage: true });

    await page.goto("/conteudos", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Conteúdos");
    await page.screenshot({ path: path.join(artifactRoot, `conteudos-${tag}.png`), fullPage: true });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#jornada").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /Antes, durante e depois/i })).toBeVisible();
    await page.screenshot({ path: path.join(artifactRoot, `landing-jornada-${tag}.png`), fullPage: false });
  });
});
