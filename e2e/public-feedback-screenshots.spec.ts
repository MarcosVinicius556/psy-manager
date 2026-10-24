import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { e2eFeedbackDocId } from "./helpers/feedback-tokens";

test.describe("feedback screenshots", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("captura formulário e obrigado em 412px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-412", "Somente viewport 412px");

    const outDir = path.join(process.cwd(), "artifacts", "feedback-412");
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto(`/feedback/${e2eFeedbackDocId(3)}`);
    await expect(page.getByRole("heading", { name: "Como foi o atendimento?" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "form.png"), fullPage: true });

    await page.goto(`/feedback/${e2eFeedbackDocId(4)}`);
    await page.getByRole("button", { name: "5 estrelas" }).click();
    await page.getByRole("button", { name: "Enviar avaliação" }).click();
    await expect(page.getByRole("heading", { name: "Obrigado pelo retorno" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "thank-you.png"), fullPage: true });
  });
});
