import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

await page.goto(`${base}/privacidade`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/privacidade-412.png`, fullPage: true });

await page.evaluate(() => window.localStorage.removeItem("psy-cookie-consent"));
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.getByTestId("cookie-banner").waitFor({ state: "visible" });
await page.screenshot({ path: `${outDir}/cookie-banner-412.png`, fullPage: false });

await page.getByRole("button", { name: "Configurar" }).click();
await page.getByTestId("cookie-preferences-sheet").waitFor({ state: "visible" });
await page.screenshot({ path: `${outDir}/cookie-configurar-sheet-412.png`, fullPage: false });

await page.goto(`${base}/cadastro`, { waitUntil: "networkidle" });
await page.getByTestId("signup-legal-terms").waitFor({ state: "visible" });
await page.screenshot({ path: `${outDir}/signup-legal-checkboxes-412.png`, fullPage: false });

await browser.close();
console.log("Screenshots saved to", outDir);
