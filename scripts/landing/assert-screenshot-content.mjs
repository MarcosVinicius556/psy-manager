/** Guards for landing Playwright captures — fail on empty onboarding states. */
export const FORBIDDEN_SCREENSHOT_PHRASES = [
  "Cadastre o básico antes de continuar",
  "Nenhum paciente cadastrado",
  "Nenhum local de atendimento cadastrado",
  "Paciente não encontrado",
  "Painel indisponível no momento",
];

export async function assertNoForbiddenScreenshotText(page) {
  for (const phrase of FORBIDDEN_SCREENSHOT_PHRASES) {
    const loc = page.getByText(phrase, { exact: false });
    if (await loc.first().isVisible().catch(() => false)) {
      throw new Error(`Screenshot guard: visible forbidden text "${phrase}"`);
    }
  }
}

export async function waitForClinicLoaded(page) {
  await page.getByText("Carregando painel...").waitFor({ state: "hidden", timeout: 90_000 }).catch(() => {});
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const loaded = await page
      .waitForFunction(
        () => {
          const text = document.body.innerText;
          if (text.includes("Cadastre o básico antes de continuar")) return false;
          return text.includes("Ana Souza") || /PACIENTES ATIVOS[\s\S]{0,80}\n\s*[1-9]/.test(text);
        },
        undefined,
        { timeout: 20_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (loaded) return;
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
  }
  throw new Error("Clinic data did not load (empty panel after retries)");
}
