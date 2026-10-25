import { test, expect } from "@playwright/test";

const unknownRoute = "/rota-inexistente-psy-manager-404-e2e";

test.describe("404 not found page", () => {
  test("shows heading and primary action on unknown route", async ({ page }) => {
    const response = await page.goto(unknownRoute, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Parece que você se perdeu" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar ao início" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
    await expect(page.getByRole("img", { name: /homem das cavernas/i })).toBeVisible();
  });
});
