const TZ = "America/Sao_Paulo";

function partsInTz(date: Date, timeZone = TZ) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value || "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** YYYY-MM-DD no fuso de Brasília. */
export function brasiliaDateYmd(date = new Date(), dayOffset = 0): string {
  const shifted = new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const p = partsInTz(shifted);
  const y = String(p.year).padStart(4, "0");
  const m = String(p.month).padStart(2, "0");
  const d = String(p.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Início e fim do dia civil em Brasília (ms UTC). */
export function brasiliaDayBoundsUtc(ymd: string): { startMillis: number; endMillis: number } {
  const [y, m, d] = ymd.split("-").map((v) => Number.parseInt(v, 10));
  if (!y || !m || !d) {
    const today = brasiliaDateYmd();
    return brasiliaDayBoundsUtc(today);
  }
  const guess = Date.UTC(y, m - 1, d, 3, 0, 0);
  const p = partsInTz(new Date(guess));
  const offsetHours = p.hour >= 12 ? p.hour - 24 : p.hour;
  const startMillis = Date.UTC(y, m - 1, d, -offsetHours, 0, 0);
  const endMillis = startMillis + 24 * 60 * 60 * 1000 - 1;
  return { startMillis, endMillis };
}

export function tomorrowBrasiliaBounds(now = Date.now()) {
  const tomorrowYmd = brasiliaDateYmd(new Date(now), 1);
  return { ymd: tomorrowYmd, ...brasiliaDayBoundsUtc(tomorrowYmd) };
}

export function isNightSilenceBrasilia(now = Date.now()) {
  const hour = partsInTz(new Date(now)).hour;
  return hour >= 22 || hour < 7;
}
