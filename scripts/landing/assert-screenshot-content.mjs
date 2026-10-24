/** Shared guards for landing Playwright captures — fail on empty onboarding states. */
export const FORBIDDEN_SCREENSHOT_PHRASES = [
  "Cadastre o básico",
  "Nenhum paciente cadastrado",
  "Nenhum local cadastrado",
  "Paciente não encontrado",
  "Painel indisponível",
];

export async function assertNoForbiddenScreenshotText(page) {
  for (const phrase of FORBIDDEN_SCREENSHOT_PHRASES) {
    const loc = page.getByText(phrase, { exact: false });
    const count = await loc.count();
    for (let i = 0; i < count; i += 1) {
      if (await loc.nth(i).isVisible().catch(() => false)) {
        throw new Error(`Screenshot guard: visible forbidden text "${phrase}"`);
      }
    }
  }
}

export async function waitForClinicLoaded(page) {
  await page.getByText("Carregando painel...").waitFor({ state: "hidden", timeout: 120_000 }).catch(() => {});
  const skeleton = page.locator(".animate-pulse").first();
  if (await skeleton.isVisible().catch(() => false)) {
    await skeleton.waitFor({ state: "hidden", timeout: 120_000 }).catch(() => {});
  }
  await page.waitForTimeout(400);
}
