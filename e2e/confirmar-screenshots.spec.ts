import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const TOKEN = crypto.randomUUID();

test.describe("confirmar sessão screenshots", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const viewport of [
    { name: "desktop-1280", width: 1280, height: 900 },
    { name: "mobile-390", width: 390, height: 844 },
  ]) {
    test(`captura tela pública em ${viewport.width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== viewport.name, `Somente ${viewport.name}`);

      const outDir = path.join(process.cwd(), "artifacts", `confirmar-${viewport.width}`);
      fs.mkdirSync(outDir, { recursive: true });

      await page.route(`**/api/public/confirm/${TOKEN}`, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              professionalNome: "Dra. Marina Costa",
              sessionDate: "2026-10-27",
              startTime: "14:00",
              modality: "online",
              placeLabel: "Online — link enviado por e-mail",
              expired: false,
              answered: false,
              status: "pendente",
            }),
          });
          return;
        }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
      });

      await page.goto(`/confirmar/${TOKEN}`);
      await expect(page.getByRole("heading", { name: "Confirmar sessão" })).toBeVisible();
      await page.screenshot({ path: path.join(outDir, "confirmar-form.png"), fullPage: true });
    });
  }
});
