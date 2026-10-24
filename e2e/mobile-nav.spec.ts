import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers/login";

const tabLabels = ["Início", "Agenda", "Pacientes", "Financeiro"] as const;

test.describe("mobile bottom nav", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("active tab labels stay readable (not covered by indicator)", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile-412") return;

    for (const path of ["/admin", "/admin/agenda", "/admin/pacientes", "/admin/financeiro"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".admin-tabbar")).toBeVisible();
      const active = page.locator('.admin-tabbar a[aria-current="page"]');
      await expect(active).toHaveCount(1);
      const label = active.locator("span").last();
      await expect(label).toBeVisible();
      const opacity = await label.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(Number(opacity)).toBeGreaterThan(0.5);
      const labelBox = await label.boundingBox();
      expect(labelBox?.height ?? 0).toBeGreaterThan(8);
      const iconWrap = active.locator("span.relative.grid").first();
      const bubble = iconWrap.locator("span.absolute.rounded-full").first();
      if (await bubble.count()) {
        const bubbleBox = await bubble.boundingBox();
        const labelTop = labelBox?.y ?? 0;
        const bubbleBottom = (bubbleBox?.y ?? 0) + (bubbleBox?.height ?? 0);
        expect(bubbleBottom).toBeLessThanOrEqual(labelTop + 2);
      }
    }
  });

  test("only one primary create control on mobile pages", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile-412") return;

    await page.goto("/admin/pacientes", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".admin-tabbar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Novo paciente", exact: true })).toHaveCount(0);

    await page.goto("/admin/agenda", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".admin-tabbar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Novo atendimento", exact: true })).toHaveCount(0);

    await page.goto("/admin/financeiro", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".admin-tabbar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Novo lançamento", exact: true })).toHaveCount(0);
  });

  test("five slots without menu tab", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile-412") return;
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".admin-tabbar")).toBeVisible();
    await expect(page.getByRole("link", { name: "Menu" })).toHaveCount(0);
    for (const label of tabLabels) {
      await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Criar", exact: true })).toBeVisible();
  });
});
