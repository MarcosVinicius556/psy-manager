import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

import { loginAsDemo } from "./helpers/login";

const publicRoutes = ["/", "/admin/login", "/plataforma/login", "/termos", "/privacidade"] as const;

const adminRoutes = [
  "/admin",
  "/admin/agenda",
  "/admin/pacientes",
  "/admin/pacientes/pat-ana",
  "/admin/financeiro",
  "/admin/configuracoes",
  "/admin/notificacoes",
  "/admin/locais",
  "/admin/pacotes",
  "/admin/assinatura",
  "/admin/usuarios",
  "/admin/operacional/contrato",
  "/admin/operacional/relatorios",
] as const;


async function assertNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const docOverflow = doc.scrollWidth - doc.clientWidth;
    const offenders: string[] = [];
    const all = document.querySelectorAll<HTMLElement>("*");
    for (const el of all) {
      if (el.closest("[data-allow-horizontal-scroll='true']")) continue;
      const style = getComputedStyle(el);
      const ox = style.overflowX;
      if (ox !== "auto" && ox !== "scroll") continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        const tag = `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(/\s+/).slice(0, 2).join(".")}` : ""}`;
        offenders.push(tag);
      }
    }
    return { docOverflow, offenders: offenders.slice(0, 8) };
  });
  expect(result.docOverflow).toBeLessThanOrEqual(1);
  expect(result.offenders, `overflow-x scroll containers: ${result.offenders.join(", ")}`).toEqual([]);
}

async function assertMobileListCardsContained(page: Page) {
  const violations = await page.evaluate(() => {
    const lists = document.querySelectorAll<HTMLElement>("[data-mobile-list]");
    const out: string[] = [];
    lists.forEach((list, listIndex) => {
      const listRect = list.getBoundingClientRect();
      Array.from(list.children).forEach((card, cardIndex) => {
        if (!(card instanceof HTMLElement)) return;
        const cardRect = card.getBoundingClientRect();
        if (cardRect.left < listRect.left - 1 || cardRect.right > listRect.right + 1) {
          out.push(`list${listIndex}-card${cardIndex}: card [${cardRect.left.toFixed(0)},${cardRect.right.toFixed(0)}] vs list [${listRect.left.toFixed(0)},${listRect.right.toFixed(0)}]`);
        }
      });
    });
    return out;
  });
  expect(violations, violations.join("; ")).toEqual([]);
}

test.describe("no horizontal scroll", () => {
  test.setTimeout(120_000);
  test.beforeAll(() => {
    fs.mkdirSync("/opt/cursor/artifacts/screenshots", { recursive: true });
  });

  for (const route of publicRoutes) {
    test(`public ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
    });
  }

  test.describe("authenticated admin", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsDemo(page);
    });

    for (const route of adminRoutes) {
      test(`admin route ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: "networkidle" });
        await assertNoHorizontalOverflow(page);
        await assertMobileListCardsContained(page);
      });
    }
  });
});
