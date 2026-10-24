export function cpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function allSame(digits: string) {
  return /^(\d)\1{10}$/.test(digits);
}

export function isValidCpf(value: string) {
  const digits = cpfDigits(value);
  if (digits.length !== 11 || allSame(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(digits[10]);
}

export function assertValidCpfOptional(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!isValidCpf(trimmed)) throw new Error(`${label} inválido.`);
  return cpfDigits(trimmed);
}

export function assertValidCpfRequired(value: string, label: string) {
  const digits = assertValidCpfOptional(value, label);
  if (!digits) throw new Error(`Informe o ${label}.`);
  return digits;
}
