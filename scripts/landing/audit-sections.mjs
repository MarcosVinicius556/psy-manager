#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const outRoot = process.argv[2] || path.join("artifacts", "landing-audit");

const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "412", width: 412, height: 915 },
];

const sectionSelectors = [
  { id: "hero", sel: "#inicio" },
  { id: "pain", sel: "#inicio ~ section" },
  { id: "funcionalidades", sel: "#funcionalidades" },
  { id: "seguranca", sel: "#seguranca" },
  { id: "receita", sel: "section:has(h2):has-text('Recibo PDF')" },
  { id: "como-funciona", sel: "#como-funciona" },
  { id: "planos", sel: "#planos" },
  { id: "faq", sel: "#faq" },
];

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: "Aceitar todos" });
  if (await accept.isVisible().catch(() => false)) await accept.click();
}

async function main() {
  fs.mkdirSync(outRoot, { recursive: true });
  const browser = await chromium.launch();
  const bugs = [];

  for (const vp of viewports) {
    const dir = path.join(outRoot, vp.name);
    fs.mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 120_000 });
    await dismissCookies(page);
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(dir, "full-page.png"), fullPage: true });

    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    if (docWidth > viewWidth + 2) {
      bugs.push(`[${vp.name}] Horizontal overflow: document ${docWidth}px > viewport ${viewWidth}px`);
    }

    for (const { id, sel } of sectionSelectors) {
      const loc = page.locator(sel).first();
      if ((await loc.count()) === 0) {
        bugs.push(`[${vp.name}] Missing section: ${id}`);
        continue;
      }
      try {
        await loc.scrollIntoViewIfNeeded({ timeout: 15_000 });
        await page.waitForTimeout(300);
        await loc.screenshot({ path: path.join(dir, `${id}.png`) });
      } catch (e) {
        bugs.push(`[${vp.name}] Screenshot failed ${id}: ${e.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  const bugPath = path.join(outRoot, "BUGS.md");
  fs.writeFileSync(
    bugPath,
    `# Landing audit\n\nBase URL: ${baseURL}\n\n${bugs.length ? bugs.map((b) => `- ${b}`).join("\n") : "- Nenhum problema automático detectado nesta passagem."}\n`
  );
  console.log(JSON.stringify({ outRoot, bugCount: bugs.length, bugs }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
