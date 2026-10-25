#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const outDir = "/opt/cursor/artifacts/screenshots";

async function login(page) {
  await page.goto(`${baseURL}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Seu e-mail").waitFor({ state: "visible", timeout: 60_000 });
  await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
  await page.getByPlaceholder("Sua senha").fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("login"), { timeout: 60_000 });
}

async function mockEmailApis(page) {
  await page.route("**/api/integrations/email", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "gmail_smtp",
        connectedAddress: "profissional@exemplo.com",
        connectedAt: new Date().toISOString(),
        available: true,
      }),
    });
  });
  await page.route("**/api/email/templates/seed", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ seeded: 5 }) });
  });
  await page.route("**/api/email/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        subject: "Pagamento confirmado — Sessão",
        body: "Olá, Maria.\n\nConfirmamos o recebimento.",
        html: "<p>Olá</p>",
      }),
    });
  });
}

async function shot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function capture(viewport, suffix) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await mockEmailApis(page);
  await login(page);

  await page.goto(`${baseURL}/admin/configuracoes`, { waitUntil: "load" });
  await page.getByRole("heading", { name: "E-mail" }).scrollIntoViewIfNeeded();
  await shot(page, `configuracoes-email-${suffix}`);

  await page.goto(`${baseURL}/admin/operacional/email`, { waitUntil: "load" });
  await page.getByRole("heading", { name: "Modelos de e-mail" }).waitFor();
  await shot(page, `modelos-email-${suffix}`);

  await page.goto(`${baseURL}/admin/pacientes`, { waitUntil: "load" });
  const firstPatient = page.locator('a[href^="/admin/pacientes/"]').first();
  if (await firstPatient.isVisible().catch(() => false)) {
    await firstPatient.click();
    await page.getByRole("button", { name: "Enviar por e-mail" }).first().click({ timeout: 5000 }).catch(() => {});
    await page.getByRole("heading", { name: /Enviar e-mail/ }).waitFor({ timeout: 5000 }).catch(() => {});
    await shot(page, `email-preview-${suffix}`);
  }

  await browser.close();
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  await capture({ width: 390, height: 844 }, "390");
  await capture({ width: 1280, height: 900 }, "desktop");
  console.log(JSON.stringify({ ok: true, outDir }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
