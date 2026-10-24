#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { assertNoForbiddenScreenshotText, waitForClinicLoaded } from "./assert-screenshot-content.mjs";

function e2eFeedbackDocId(sequence) {
  const tail = String(sequence).padStart(12, "0");
  return ["00000000", "0000", "4000", "8000", tail].join("-");
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const outDir = path.join(process.cwd(), "public", "landing");

const shots = [
  {
    name: "admin-inicio",
    route: "/admin",
    desktop: true,
    admin: true,
    prepare: dismissCookies,
    ready: async (page) => {
      await page.getByRole("heading", { name: "Início" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.getByText(/Total (recebido|a receber)/i).first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "agenda-semana",
    route: "/admin/agenda",
    desktop: true,
    admin: true,
    prepare: async (page) => {
      await dismissCookies(page);
      const week = page.getByRole("button", { name: "Semana" });
      if (await week.count()) await week.click();
      await page.waitForTimeout(500);
    },
    ready: async (page) => {
      await page.getByText("Ana Souza").first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "paciente-prontuario",
    route: "/admin/pacientes/pat-ana",
    desktop: true,
    admin: true,
    prepare: dismissCookies,
    ready: async (page) => {
      await page.getByRole("heading", { name: "Ana Souza" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.getByText("Linha do tempo").waitFor({ state: "visible", timeout: 60_000 });
      await page.getByText("Visualizar").first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "financeiro",
    route: "/admin/financeiro",
    desktop: true,
    admin: true,
    prepare: dismissCookies,
    ready: async (page) => {
      await page.getByRole("heading", { name: "Contas a receber" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.getByText("Ana Souza").first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "receita-saude",
    route: "/admin/financeiro/receita-saude",
    desktop: true,
    admin: true,
    prepare: dismissCookies,
    ready: async (page) => {
      await page.getByText(/Receita Saúde/i).first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "avaliacao-paciente",
    route: `/feedback/${e2eFeedbackDocId(1)}`,
    desktop: true,
    admin: false,
    prepare: dismissCookies,
    ready: async (page) => {
      await page.getByText(/Ana Souza/i).first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "avaliacao-paciente-mobile",
    route: `/feedback/${e2eFeedbackDocId(1)}`,
    desktop: false,
    admin: false,
    prepare: dismissCookies,
    ready: async (page) => {
      await page.getByText(/Ana Souza/i).first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
];

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(300);
  }
}

async function login(page) {
  await page.goto(`${baseURL}/admin/login`, { waitUntil: "domcontentloaded" });
  await dismissCookies(page);
  const email = page.locator('input[autocomplete="email"]');
  const password = page.locator('input[autocomplete="current-password"]');
  await email.waitFor({ state: "visible", timeout: 120_000 });
  if (await page.getByRole("heading", { name: "Painel indisponível no momento" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await email.waitFor({ state: "visible", timeout: 120_000 });
  }
  await email.fill(demoEmail);
  await password.fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), {
    timeout: 120_000,
  });
  await page.getByRole("link", { name: "Início" }).first().waitFor({ state: "visible", timeout: 120_000 });
}

async function saveWebpAvif(pngBuffer, name) {
  const webp = path.join(outDir, `${name}.webp`);
  const avif = path.join(outDir, `${name}.avif`);
  await sharp(pngBuffer).webp({ quality: 86 }).toFile(webp);
  await sharp(pngBuffer).avif({ quality: 62 }).toFile(avif);
  return { webp, avif };
}

async function captureTarget(page, admin) {
  if (!admin) {
    return page;
  }
  const content = page.locator("div.mx-auto.max-w-\\[1200px\\]").first();
  await content.waitFor({ state: "visible", timeout: 60_000 });
  return content;
}

async function capture(page, shot) {
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  if (shot.admin) await waitForClinicLoaded(page);
  if (shot.ready) await shot.ready(page);
  await assertNoForbiddenScreenshotText(page);
  await page.waitForTimeout(300);
  const target = await captureTarget(page, shot.admin);
  const png = await target.screenshot({ type: "png", animations: "disabled" });
  await assertNoForbiddenScreenshotText(page);
  return png;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await login(desktopPage);

  const written = [];
  for (const shot of shots.filter((s) => s.desktop)) {
    await desktopPage.goto(`${baseURL}${shot.route}`, { waitUntil: "domcontentloaded" });
    if (shot.prepare) await shot.prepare(desktopPage);
    const png = await capture(desktopPage, shot);
    written.push(await saveWebpAvif(png, shot.name));
  }
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  for (const shot of shots.filter((s) => !s.desktop)) {
    await mobilePage.goto(`${baseURL}${shot.route}`, { waitUntil: "domcontentloaded" });
    if (shot.prepare) await shot.prepare(mobilePage);
    const png = await capture(mobilePage, shot);
    written.push(await saveWebpAvif(png, shot.name));
  }
  await mobileContext.close();

  await browser.close();
  console.log(JSON.stringify({ ok: true, outDir, files: written }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
