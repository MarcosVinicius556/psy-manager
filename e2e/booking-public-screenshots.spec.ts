import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const MOCK_VIEW = {
  enabled: true,
  professionalName: "Dra. Marina Costa",
  durationMinutes: 50,
  modalities: ["online", "presencial"],
  slots: [
    { date: "2026-10-28", startTime: "10:00", endTime: "10:50" },
    { date: "2026-10-28", startTime: "14:00", endTime: "14:50" },
  ],
};

test.describe("agendamento público screenshots", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const viewport of [
    { name: "desktop-1280", width: 1280, height: 900 },
    { name: "mobile-390", width: 390, height: 844 },
  ]) {
    test(`página /agendar em ${viewport.width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== viewport.name, `Somente ${viewport.name}`);

      const outDir = path.join(process.cwd(), "artifacts", `agendar-${viewport.width}`);
      fs.mkdirSync(outDir, { recursive: true });

      await page.route("**/api/public/booking/marina-costa", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_VIEW),
          });
          return;
        }
        await route.continue();
      });

      await page.goto("/agendar/marina-costa");
      await expect(page.getByRole("heading", { name: /Agendar com/ })).toBeVisible();
      await page.screenshot({ path: path.join(outDir, "agendar-publico.png"), fullPage: true });
    });
  }
});

test.describe("config agendamento público screenshots", () => {
  test.skip(true, "Requer e2e/.auth/user.json (gerado pelo fluxo e2e:mobile).");

  for (const viewport of [
    { name: "desktop-1280", width: 1280, height: 900 },
    { name: "mobile-390", width: 390, height: 844 },
  ]) {
    test(`configurações agendamento em ${viewport.width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== viewport.name, `Somente ${viewport.name}`);

      const outDir = path.join(process.cwd(), "artifacts", `agendamento-settings-${viewport.width}`);
      fs.mkdirSync(outDir, { recursive: true });

      await page.route("**/api/booking/profile", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              profile: {
                slug: "marina-costa",
                ownerUid: "owner",
                enabled: true,
                durationMinutes: 50,
                bufferMinutes: 10,
                advanceDays: 21,
                minNoticeHours: 24,
                modalities: ["online", "presencial"],
                acceptNewPatients: true,
                locationId: null,
                professionalMemberId: "m1",
                displayName: "Dra. Marina Costa",
                updatedAt: new Date().toISOString(),
              },
              publicPath: "/agendar/marina-costa",
            }),
          });
          return;
        }
        await route.continue();
      });

      await page.goto("/admin/configuracoes/agendamento-publico", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Agendamento público" })).toBeVisible({ timeout: 15000 });
      await page.screenshot({ path: path.join(outDir, "settings.png"), fullPage: true });
    });
  }
});
