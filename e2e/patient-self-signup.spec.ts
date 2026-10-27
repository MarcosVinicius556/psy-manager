import { test, expect } from "@playwright/test";

test.describe("portal do paciente — cadastro e conexões", () => {
  test("login exibe criar conta, Google e link por e-mail", async ({ page }) => {
    await page.goto("/paciente/login");
    await expect(page.getByRole("heading", { name: "Portal do paciente" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar com Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Link por e-mail" })).toBeVisible();
  });

  test("minhas conexões redireciona para login sem sessão", async ({ page }) => {
    await page.goto("/paciente/conexoes");
    await expect(page).toHaveURL(/\/paciente\/login/);
  });

  test("onboarding redireciona para login sem sessão", async ({ page }) => {
    await page.goto("/paciente/onboarding");
    await expect(page).toHaveURL(/\/paciente\/login/);
  });
});
