#!/usr/bin/env node
/**
 * Production evidence captures — fails fast if CSS/fonts did not load.
 * Usage: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 node scripts/landing/capture-pr-evidence.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const outDir = process.env.ARTIFACT_OUT || "/opt/cursor/artifacts/landing-pr-evidence";

const sections = [
  { id: "hero", sel: "#inicio", file: "viewport" },
  { id: "pain", sel: "#inicio ~ section", file: "pain-solution" },
  { id: "funcionalidades", sel: "#funcionalidades", file: "funcionalidades" },
  { id: "seguranca", sel: "#seguranca", file: "seguranca" },
  { id: "planos", sel: "#planos", file: "planos" },
];

const viewports = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "412x915", width: 412, height: 915 },
];

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(300);
  }
}

async function assertStyled(page) {
  const cssOk = await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const hrefs = links.map((l) => l.href).filter((h) => h.includes("/_next/static/css/"));
    if (hrefs.length === 0) return { ok: false, reason: "no-next-css-link" };
    for (const href of hrefs) {
      try {
        const res = await fetch(href, { method: "HEAD" });
        if (!res.ok) return { ok: false, reason: `css-${res.status}:${href}` };
      } catch (e) {
        return { ok: false, reason: `css-fetch:${String(e)}` };
      }
    }
    await document.fonts.ready;
    const h1 = document.querySelector("h1");
    if (!h1) return { ok: false, reason: "no-h1" };
    const font = getComputedStyle(h1).fontFamily.toLowerCase();
    if (font.includes("times new roman") && !font.includes("dm")) {
      return { ok: false, reason: `font-${font}` };
    }
    const bg = getComputedStyle(document.body).backgroundColor;
    return { ok: true, font, bg, cssCount: hrefs.length };
  });
  if (!cssOk.ok) {
    throw new Error(`Page appears unstyled: ${cssOk.reason}`);
  }
  return cssOk;
}

async function assertHeroCopy(page) {
  const heroText = await page.locator("#inicio").innerText();
  const banned = ["lado de cá", "página da clínica", "página pública da clínica"];
  for (const phrase of banned) {
    if (heroText.includes(phrase)) {
      throw new Error(`Banned copy in #inicio: "${phrase}"`);
    }
  }
  await page.locator("#inicio").getByText(/dia a dia da prática clínica/i).waitFor({
    state: "visible",
    timeout: 15_000,
  });
}

async function waitForHeroImages(page) {
  await page.waitForFunction(
    () => {
      const imgs = document.querySelectorAll("#inicio img");
      if (imgs.length < 1) return false;
      return [...imgs].some((img) => img.complete && img.naturalWidth > 40);
    },
    { timeout: 30_000 }
  );
}

async function captureViewport(page, outPath) {
  await page.goto(`${baseURL}/`, { waitUntil: "networkidle", timeout: 120_000 });
  await dismissCookies(page);
  await assertStyled(page);
  await assertHeroCopy(page);
  await waitForHeroImages(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: outPath, fullPage: false });
  const stat = fs.statSync(outPath);
  if (stat.size < 80_000) {
    throw new Error(`Screenshot suspiciously small (${stat.size} bytes): ${outPath}`);
  }
}

async function captureSection(page, sel, outPath) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded({ timeout: 20_000 });
  await page.waitForTimeout(350);
  await assertStyled(page);
  await loc.screenshot({ path: outPath });
  const stat = fs.statSync(outPath);
  if (stat.size < 25_000) {
    throw new Error(`Section screenshot too small (${stat.size} bytes): ${outPath}`);
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const manifest = [];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    const heroPath = path.join(outDir, `hero-${vp.name}.png`);
    await captureViewport(page, heroPath);
    manifest.push({ type: "hero", viewport: vp.name, path: heroPath, bytes: fs.statSync(heroPath).size });

    const sectionIds = vp.width >= 768 ? ["funcionalidades", "seguranca", "planos"] : ["funcionalidades", "planos"];
    for (const id of sectionIds) {
      const meta = sections.find((s) => s.id === id);
      if (!meta) continue;
      const filePath = path.join(outDir, `${meta.file}-${vp.name}.png`);
      await captureSection(page, meta.sel, filePath);
      manifest.push({ type: meta.file, viewport: vp.name, path: filePath, bytes: fs.statSync(filePath).size });
    }

    await context.close();
  }

  await browser.close();
  const manifestPath = path.join(outDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify({ baseURL, capturedAt: new Date().toISOString(), files: manifest }, null, 2));
  console.log(JSON.stringify({ ok: true, outDir, manifestPath, files: manifest }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
