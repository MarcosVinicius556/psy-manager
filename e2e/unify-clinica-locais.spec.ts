import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers/login";

test.describe("Locais unificado com clínica", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("redirects legacy equipe clinica to locais", async ({ page }) => {
    await page.goto("/admin/equipe/clinica", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/admin\/locais/);
  });

  test("mobile menu has no Equipe > Clínica", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/admin", { waitUntil: "networkidle" });
    const menuButton = page.getByRole("button", { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
    const sheet = page.getByTestId("admin-mobile-menu-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByRole("link", { name: "Clínica", exact: true })).toHaveCount(0);
  });

  test("legacy invite URL redirects to locais convite", async ({ page }) => {
    await page.goto("/admin/equipe/clinica/convite/demo-token-abc", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/admin\/locais\/convite\/demo-token-abc/);
  });
});
