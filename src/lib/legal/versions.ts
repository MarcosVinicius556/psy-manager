import { LEGAL_DOCUMENTS, type LegalAcceptanceDocument } from "./config";

/** Compara versões no formato major.minor (ex.: 1.0, 2.0). */
export function compareLegalVersions(left: string, right: string): number {
  const parse = (value: string) =>
    value
      .trim()
      .split(".")
      .map((part) => Number.parseInt(part, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));
  const a = parse(left);
  const b = parse(right);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export function isLegalVersionOutdated(accepted: string | undefined | null, current: string) {
  if (!accepted?.trim()) return true;
  return compareLegalVersions(accepted, current) < 0;
}

export function documentsRequiringAcceptance(
  acceptedVersions: Partial<Record<LegalAcceptanceDocument, string>>,
  options: { requireDpa: boolean },
): LegalAcceptanceDocument[] {
  const required: LegalAcceptanceDocument[] = ["termos", "privacidade"];
  if (options.requireDpa) required.push("dpa");
  return required.filter((doc) => isLegalVersionOutdated(acceptedVersions[doc], currentVersionFor(doc)));
}

export function currentVersionFor(document: LegalAcceptanceDocument) {
  return LEGAL_DOCUMENTS[document].version;
}
