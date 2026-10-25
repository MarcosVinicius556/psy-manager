import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers/login";

test.describe("Modelos de e-mail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.route("**/api/integrations/email", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          provider: "gmail_smtp",
          connectedAddress: "prof@test.com",
          connectedAt: new Date().toISOString(),
          available: true,
        }),
      });
    });
    await page.route("**/api/email/preview", async (route) => {
      const body = route.request().postDataJSON() as { subject?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          subject: body.subject || "Assunto",
          body: "Corpo renderizado",
          html: "<p>Corpo</p>",
        }),
      });
    });
    await page.route("**/api/email/templates/seed", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ seeded: 5 }) });
    });
  });

  test("lista modelos e abre prévia de envio", async ({ page }) => {
    await page.goto("/admin/operacional/email");
    await expect(page.getByRole("heading", { name: "Modelos de e-mail" })).toBeVisible();
    await page.goto("/admin/configuracoes");
    await expect(page.getByRole("heading", { name: "E-mail" })).toBeVisible();
    await expect(page.getByText("prof@test.com")).toBeVisible();
  });
});
