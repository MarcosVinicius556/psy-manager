import { test, expect } from "@playwright/test";

test.describe("cadastro legal", () => {
  test("exige checkboxes de termos e DPA", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByPlaceholder("Nome e sobrenome").fill("Teste Legal");
    await page.getByPlaceholder("Seu e-mail").fill(`legal-${Date.now()}@example.com`);
    await page.getByPlaceholder("Senha, mínimo de 8 caracteres").fill("SenhaSegura1!");
    await page.getByPlaceholder("Confirme a senha").fill("SenhaSegura1!");
    const submit = page.getByRole("button", { name: "Começar meus 30 dias" });
    await expect(submit).toBeDisabled();
    await page.getByTestId("signup-legal-terms").locator('input[type="checkbox"]').check();
    await expect(submit).toBeDisabled();
    await page.getByTestId("signup-legal-dpa").locator('input[type="checkbox"]').check();
    await expect(submit).toBeEnabled();
  });
});
