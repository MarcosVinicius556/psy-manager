#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
function e2eFeedbackDocId(sequence) {
  const tail = String(sequence).padStart(12, "0");
  return ["00000000", "0000", "4000", "8000", tail].join("-");
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const outDir = path.join(process.cwd(), "public", "landing");

const shots = [
  { name: "admin-inicio", route: "/admin", desktop: true, prepare: dismissCookies },
  {
    name: "agenda-semana",
    route: "/admin/agenda",
    desktop: true,
    prepare: async (page) => {
      await dismissCookies(page);
      const week = page.getByRole("button", { name: "Semana" });
      if (await week.count()) await week.click();
      await page.waitForTimeout(600);
    },
  },
  {
    name: "paciente-prontuario",
    route: "/admin/pacientes/pat-ana",
    desktop: true,
    prepare: dismissCookies,
  },
  { name: "financeiro", route: "/admin/financeiro", desktop: true, prepare: dismissCookies },
  { name: "receita-saude", route: "/admin/financeiro/receita-saude", desktop: true, prepare: dismissCookies },
  {
    name: "avaliacao-paciente",
    route: `/feedback/${e2eFeedbackDocId(1)}`,
    desktop: true,
    prepare: dismissCookies,
  },
  {
    name: "avaliacao-paciente-mobile",
    route: `/feedback/${e2eFeedbackDocId(1)}`,
    desktop: false,
    prepare: dismissCookies,
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
  await page.getByPlaceholder("Seu e-mail").fill(demoEmail);
  await page.getByPlaceholder("Sua senha").fill(demoPassword);
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

async function capture(page, name) {
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(800);
  const png = await page.screenshot({ type: "png", fullPage: false });
  return saveWebpAvif(png, name);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();
  await login(desktopPage);

  const written = [];
  for (const shot of shots.filter((s) => s.desktop)) {
    await desktopPage.goto(`${baseURL}${shot.route}`, { waitUntil: "domcontentloaded" });
    if (shot.prepare) await shot.prepare(desktopPage);
    written.push(await capture(desktopPage, shot.name));
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
    written.push(await capture(mobilePage, shot.name));
  }
  await mobileContext.close();

  await browser.close();
  console.log(JSON.stringify({ ok: true, outDir, files: written }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
