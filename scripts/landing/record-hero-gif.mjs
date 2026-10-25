#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const outDir = process.env.LANDING_GIF_OUT || path.join("artifacts", "screenshots", "landing-redesign");
const framesDir = path.join(outDir, "gif-frames");

async function main() {
  fs.mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) await accept.click();

  for (let i = 0; i < 12; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), i * 120);
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(2, "0")}.png`) });
  }
  await browser.close();

  const gifOut = path.join(outDir, "landing-hero-scroll.gif");
  try {
    execSync(
      `ffmpeg -y -framerate 10 -i "${framesDir}/f%02d.png" -vf "scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${gifOut}"`,
      { stdio: "inherit" }
    );
    console.log(JSON.stringify({ ok: true, gifOut }, null, 2));
  } catch {
    console.log(JSON.stringify({ ok: false, framesDir, note: "ffmpeg unavailable; frames saved" }, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
