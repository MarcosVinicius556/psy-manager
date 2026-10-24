const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(hundreds[h]);
  if (rest >= 10 && rest < 20) {
    parts.push(teens[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const u = rest % 10;
    if (t) parts.push(tens[t]);
    if (u) parts.push(units[u]);
  }
  return parts.join(" e ");
}

function integerToWords(n: number): string {
  if (n === 0) return "zero";
  const chunks: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const remainder = n % 1000;
  if (millions) {
    chunks.push(millions === 1 ? "um milhão" : `${integerToWords(millions)} milhões`);
  }
  if (thousands) {
    chunks.push(thousands === 1 ? "mil" : `${integerToWords(thousands)} mil`);
  }
  if (remainder) chunks.push(chunkToWords(remainder));
  return chunks.join(" e ");
}

export function moneyInWords(value: number) {
  const cents = Math.round(value * 100);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisText = reais === 1 ? "um real" : `${integerToWords(reais)} reais`;
  if (centavos === 0) return reaisText;
  const centText = centavos === 1 ? "um centavo" : `${integerToWords(centavos)} centavos`;
  return `${reaisText} e ${centText}`;
}
