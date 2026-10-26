import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { loginAsDemo } from "./helpers/login";
import { E2E_FORM_TOKEN, E2E_SIGN_TOKEN } from "./helpers/o4-tokens";

const artifactRoot = "/opt/cursor/artifacts/screenshots/o4-documentos";

test.describe("O4 documentos — screenshots", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("páginas públicas @mobile-390 @desktop-1280", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile-390";
    const isDesktop = testInfo.project.name === "desktop-1280";
    test.skip(!isMobile && !isDesktop, "390 e 1280 apenas");
    const tag = isMobile ? "390" : "1280";
    fs.mkdirSync(artifactRoot, { recursive: true });

    await page.goto(`/assinar/${E2E_SIGN_TOKEN}`);
    await expect(page.getByRole("heading", { name: /Termo de Consentimento/i })).toBeVisible();
    await page.screenshot({ path: path.join(artifactRoot, `assinar-${tag}.png`), fullPage: true });

    await page.goto(`/formulario/${E2E_FORM_TOKEN}`);
    await expect(page.getByRole("heading", { name: "Anamnese TCC" })).toBeVisible();
    await page.screenshot({ path: path.join(artifactRoot, `formulario-${tag}.png`), fullPage: true });
  });

  test("painel operacional @mobile-390 @desktop-1280", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile-390";
    const isDesktop = testInfo.project.name === "desktop-1280";
    test.skip(!isMobile && !isDesktop, "390 e 1280 apenas");
    const tag = isMobile ? "390" : "1280";
    fs.mkdirSync(artifactRoot, { recursive: true });

    await loginAsDemo(page);
    await page.goto("/admin/operacional/conformidade");
    await expect(page.getByRole("heading", { name: /Conformidade/i })).toBeVisible();
    await page.screenshot({ path: path.join(artifactRoot, `conformidade-${tag}.png`), fullPage: true });

    await page.goto("/admin/operacional/formularios");
    await expect(page.getByRole("heading", { name: /Formulários/i })).toBeVisible();
    await page.screenshot({ path: path.join(artifactRoot, `formularios-${tag}.png`), fullPage: true });
  });
});
