import { test, expect } from "@playwright/test";
import { e2eFeedbackDocId } from "./helpers/feedback-tokens";

test.describe("feedback público sem login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sem banner de cookies cobrindo o envio em 412px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-412", "Viewport 412px");
    await page.goto(`/feedback/${e2eFeedbackDocId(3)}`);
    await expect(page.getByTestId("cookie-banner")).toBeHidden();
    const submit = page.getByRole("button", { name: "Enviar avaliação" });
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(915);
    }
  });

  test("envia avaliação e bloqueia segundo envio", async ({ page }) => {
    await page.goto(`/feedback/${e2eFeedbackDocId(1)}`);
    await expect(page.getByRole("heading", { name: "Como foi o atendimento?" })).toBeVisible();
    await page.getByRole("button", { name: "4 estrelas" }).click();
    await page.getByPlaceholder("Opcional").fill("Atendimento atencioso.");
    await page.getByRole("button", { name: "Enviar avaliação" }).click();
    await expect(page.getByRole("heading", { name: "Obrigado pelo retorno" })).toBeVisible();

    await page.goto(`/feedback/${e2eFeedbackDocId(1)}`);
    await expect(page.getByRole("heading", { name: "Link indisponível" })).toBeVisible();
  });

  test("link já respondido mostra indisponível", async ({ page }) => {
    await page.goto(`/feedback/${e2eFeedbackDocId(2)}`);
    await expect(page.getByRole("heading", { name: "Link indisponível" })).toBeVisible();
  });
});
