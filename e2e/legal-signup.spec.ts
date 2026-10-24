import { test, expect } from "@playwright/test";

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const banner = page.getByTestId("cookie-banner");
  if (await banner.isVisible().catch(() => false)) {
    await banner.getByRole("button", { name: "Rejeitar não necessários" }).click();
  }
}

test.describe("cadastro legal", () => {
  test("exige checkboxes de termos e DPA", async ({ page }) => {
    await page.goto("/cadastro");
    await dismissCookieBanner(page);
    await page.getByPlaceholder("Nome e sobrenome").fill("Teste Legal");
    await page.getByPlaceholder("Seu e-mail").fill(`legal-${Date.now()}@example.com`);
    await page.getByPlaceholder("Senha, mínimo de 8 caracteres").fill("SenhaSegura1!");
    await page.getByPlaceholder("Confirme a senha").fill("SenhaSegura1!");

    await expect(page.getByTestId("signup-legal-terms").locator('input[type="checkbox"]')).toHaveJSProperty("required", true);
    await expect(page.getByTestId("signup-legal-dpa").locator('input[type="checkbox"]')).toHaveJSProperty("required", true);

    const submit = page.getByRole("button", { name: "Começar meus 30 dias" });
    await expect(submit).toBeDisabled();

    await page.getByTestId("signup-legal-terms").click();
    await expect(submit).toBeDisabled();

    await page.getByTestId("signup-legal-dpa").scrollIntoViewIfNeeded();
    await page.getByTestId("signup-legal-dpa").click();

    const firebaseReady = (await page.getByText("O acesso ainda não está disponível neste ambiente.").count()) === 0;
    if (firebaseReady) {
      await expect(submit).toBeEnabled();
    }
  });
});
