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

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3020";
const demoEmail = process.env.E2E_DEMO_EMAIL || "demo@clinica.test";
const demoPassword = process.env.E2E_DEMO_PASSWORD || "Demo123456!";
const outDir = path.join(process.cwd(), "public", "landing");

function mondayIso() {
  const d = new Date();
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const agendaDate = mondayIso();

/** Screenshots referenced by landing (hero, features, receita, how-it-works). */
const shots = [
  {
    name: "admin-inicio",
    route: "/admin",
    admin: true,
    ready: async (page) => {
      await page.getByRole("heading", { name: "Início" }).waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "agenda-semana",
    route: `/admin/agenda?date=${agendaDate}`,
    admin: true,
    prepare: async (page) => {
      await page.getByRole("heading", { name: "Agenda" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.getByRole("button", { name: "Semana", exact: true }).click();
    },
    ready: async (page) => {
      await page.getByRole("heading", { name: "Esta semana" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.getByRole("link", { name: /Ana Souza/i }).first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "paciente-prontuario",
    route: "/admin/pacientes/pat-ana",
    admin: true,
    ready: async (page) => {
      await page.getByRole("heading", { name: "Ana Souza" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.getByText("Linha do tempo").waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "financeiro",
    route: "/admin/financeiro",
    admin: true,
    ready: async (page) => {
      await page.getByRole("heading", { name: "Contas a receber" }).waitFor({ state: "visible", timeout: 60_000 });
      await page.locator("table tbody tr").first().waitFor({ state: "visible", timeout: 60_000 });
    },
  },
  {
    name: "receita-saude",
    route: "/admin/financeiro/receita-saude",
    admin: true,
    ready: async (page) => {
      await page.waitForFunction(() => /Receita Saúde/i.test(document.body.innerText), undefined, { timeout: 60_000 });
    },
  },
  {
    name: "avaliacao-paciente-mobile",
    route: `/feedback/${e2eFeedbackDocId(1)}`,
    admin: false,
    mobile: true,
    ready: async (page) => {
      await page.waitForFunction(
        () => /Como foi o atendimento\?/i.test(document.body.innerText),
        undefined,
        { timeout: 60_000 }
      );
    },
  },
];

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(200);
  }
}

async function login(page) {
  await page.goto(`${baseURL}/admin/login`, { waitUntil: "domcontentloaded" });
  await dismissCookies(page);
  const email = page.locator('input[type="email"]');
  const password = page.locator('input[type="password"]').first();
  await email.waitFor({ state: "visible", timeout: 90_000 });
  await email.fill(demoEmail);
  await password.fill(demoPassword);
  await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click({ force: true });
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"), {
    timeout: 90_000,
  });
  await page.getByRole("link", { name: "Início" }).first().waitFor({ state: "visible", timeout: 90_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Início" }).first().waitFor({ state: "visible", timeout: 90_000 });
}

async function saveWebpAvif(pngBuffer, name) {
  const webp = path.join(outDir, `${name}.webp`);
  const avif = path.join(outDir, `${name}.avif`);
  await sharp(pngBuffer).webp({ quality: 86 }).toFile(webp);
  await sharp(pngBuffer).avif({ quality: 62 }).toFile(avif);
  return { webp, avif };
}

async function capture(page, shot) {
  await page.waitForLoadState("domcontentloaded");
  if (shot.admin) await waitForClinicLoaded(page);
  if (shot.prepare) await shot.prepare(page);
  if (shot.ready) await shot.ready(page);
  await assertNoForbiddenScreenshotText(page);
  const target = shot.admin
    ? page.locator("div.mx-auto.max-w-\\[1200px\\]").first()
    : page.locator("form").first();
  await target.waitFor({ state: "visible", timeout: 60_000 }).catch(() => {});
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
  for (const shot of shots.filter((s) => !s.mobile)) {
    await desktopPage.goto(`${baseURL}${shot.route}`, { waitUntil: "domcontentloaded" });
    await dismissCookies(desktopPage);
    written.push(await saveWebpAvif(await capture(desktopPage, shot), shot.name));
  }
  await desktopContext.close();

  const mobileShot = shots.find((s) => s.mobile);
  if (mobileShot) {
    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${baseURL}${mobileShot.route}`, { waitUntil: "domcontentloaded" });
    await dismissCookies(mobilePage);
    written.push(await saveWebpAvif(await capture(mobilePage, mobileShot), mobileShot.name));
    await mobileContext.close();
  }

  await browser.close();
  console.log(JSON.stringify({ ok: true, outDir, files: written }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
