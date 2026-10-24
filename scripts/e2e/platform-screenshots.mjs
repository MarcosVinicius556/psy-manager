#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const platformEmail = process.env.E2E_PLATFORM_EMAIL || "platform@psy.test";
const platformPassword = process.env.E2E_PLATFORM_PASSWORD || "Platform123456!";
const outDir = "/opt/cursor/artifacts/screenshots";

async function login(page, email, password) {
  await page.goto(`${baseURL}/admin/login`);
  await page.getByPlaceholder("Seu e-mail").fill(email);
  await page.getByPlaceholder("Sua senha").fill(password);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("login"), { timeout: 60_000 });
}

async function shot(page, name, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (page.url().includes("login")) throw new Error(`Unexpected login redirect at ${route}`);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

  await login(page, platformEmail, platformPassword);
  await shot(page, "plataforma-home-412", "/plataforma");
  await shot(page, "plataforma-contas-412", "/plataforma/contas");

  await login(page, demoEmail, demoPassword);
  await shot(page, "admin-pacientes-412", "/admin/pacientes");
  await shot(page, "admin-financeiro-412", "/admin/financeiro");

  await browser.close();
  console.log(JSON.stringify({ ok: true, outDir }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
