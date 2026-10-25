import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { loginAsDemo } from "./helpers/login";

const artifactRoot = "/opt/cursor/artifacts/screenshots/tickets";

type MockTicket = {
  id: string;
  humanId: string;
  title: string;
  description: string;
  extraInfo: string;
  impact: string;
  openedBy: { uid: string; name: string; email: string; clinicId: string };
  createdAt: string;
  updatedAt: string;
  status: string;
  priority: string;
  classification: string | null;
  assignee: { type: string; name: string };
  github: Record<string, unknown>;
  bot: { state: string; attempts: number };
  review: { state: string };
  version: number;
};

function baseTicket(overrides: Partial<MockTicket> = {}): MockTicket {
  const now = new Date().toISOString();
  return {
    id: "ticket-e2e-1",
    humanId: "CH-000042",
    title: "Erro ao salvar paciente",
    description: "Detalhes do problema no formulário.",
    extraInfo: "",
    impact: "Alto",
    openedBy: { uid: "demo-user", name: "Demo", email: "demo@clinica.test", clinicId: "demo-user" },
    createdAt: now,
    updatedAt: now,
    status: "aberto",
    priority: "media",
    classification: null,
    assignee: { type: "bot", name: "Grok Bot" },
    github: {},
    bot: { state: "idle", attempts: 0 },
    review: { state: "pending" },
    version: 1,
    ...overrides,
  };
}

async function installSupportMocks(page: Page, tickets: MockTicket[]) {
  await page.route("**/api/support/tickets", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tickets }),
      });
      return;
    }
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { title?: string; description?: string };
      const created = baseTicket({
        id: "ticket-created",
        humanId: "CH-000099",
        title: body.title ?? "Novo",
        description: body.description ?? "",
      });
      tickets.unshift(created);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: created.id, humanId: created.humanId }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/support/tickets/*", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/messages") || url.endsWith("/attachments") || url.endsWith("/reopen") || url.endsWith("/review")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }
    const id = url.split("/api/support/tickets/")[1]?.split("?")[0];
    const ticket = tickets.find((t) => t.id === id) ?? tickets[0];
    await route.fulfill({
      status: ticket ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify({
        ticket,
        messages: [
          {
            id: "m1",
            authorType: "user",
            authorId: ticket.openedBy.uid,
            authorName: ticket.openedBy.name,
            body: ticket.description,
            attachments: [],
            source: "app",
            createdAt: ticket.createdAt,
          },
        ],
        history: [
          {
            id: "h1",
            type: "ticket_created",
            actor: { uid: ticket.openedBy.uid, name: ticket.openedBy.name, role: "user" },
            at: ticket.createdAt,
            to: { status: "aberto" },
          },
        ],
        executions: [],
        signedAttachments: [],
      }),
    });
  });
}

test.describe("support tickets — owner flow", () => {
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("list shows ticket and opens detail @mobile-390 @desktop-1280", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile-390";
    const isDesktop = testInfo.project.name === "desktop-1280";
    test.skip(!isMobile && !isDesktop, "390 and 1280 only");

    const tickets = [baseTicket()];
    await installSupportMocks(page, tickets);

    await page.goto("/admin/suporte", { waitUntil: "networkidle" });
    await expect(page.getByTestId("support-ticket-card")).toContainText("CH-000042");
    await expect(page.getByTestId("support-empty-state")).toHaveCount(0);
    await page.screenshot({
      path: path.join(artifactRoot, `list-${testInfo.project.name}.png`),
      fullPage: true,
    });

    await page.getByTestId("support-ticket-card").click();
    await expect(page.getByTestId("support-ticket-detail")).toBeVisible();
    await expect(page.getByTestId("support-activity-feed")).toBeVisible();
    await page.screenshot({
      path: path.join(artifactRoot, `detail-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test("create redirects to detail @mobile-390 @desktop-1280", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile-390";
    const isDesktop = testInfo.project.name === "desktop-1280";
    test.skip(!isMobile && !isDesktop, "390 and 1280 only");

    const tickets: MockTicket[] = [];
    await installSupportMocks(page, tickets);

    await page.goto("/admin/suporte/novo", { waitUntil: "networkidle" });
    await page.getByLabel("Título").fill("Falha na agenda");
    await page.getByLabel("Descrição").fill("Horário não salva ao editar.");
    await page.getByRole("button", { name: "Abrir chamado" }).click();
    await page.waitForURL(/\/admin\/suporte\/ticket-created/, { timeout: 180_000 });
    await expect(page.getByTestId("support-ticket-detail")).toBeVisible();
  });

  test("list error shows retry not empty state @mobile-390", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "mobile error state");

    await page.route("**/api/support/tickets", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ reason: "erro_listagem" }) });
    });

    await page.goto("/admin/suporte", { waitUntil: "networkidle" });
    await expect(page.getByRole("alert").first()).toContainText("Falha ao carregar chamados");
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    await expect(page.getByTestId("support-empty-state")).toHaveCount(0);
  });
});
