import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const routes = [
  "/paciente/login",
  "/paciente",
  "/paciente/sessoes",
  "/paciente/pagamentos",
  "/paciente/documentos",
  "/paciente/diario",
  "/paciente/tarefas",
  "/paciente/mural",
  "/paciente/escalas",
  "/paciente/configuracoes",
] as const;

const viewports = [
  { name: "1280", width: 1280, height: 900 },
  { name: "390", width: 390, height: 844 },
] as const;

test.describe("O5 portal do paciente — screenshots", () => {
  for (const route of routes) {
    for (const vp of viewports) {
      test(`${route} @ ${vp.name}px`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route, { waitUntil: "networkidle" });
        const outDir = path.join(process.cwd(), "artifacts", "o5-paciente");
        fs.mkdirSync(outDir, { recursive: true });
        const slug = route.replace(/\//g, "_").replace(/^_/, "") || "root";
        await page.screenshot({
          path: path.join(outDir, `${slug}-${vp.name}.png`),
          fullPage: true,
        });
        await expect(page.locator("body")).toBeVisible();
      });
    }
  }
});
