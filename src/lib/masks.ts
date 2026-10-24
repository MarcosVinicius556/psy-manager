function digits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export function maskCpf(value: string) {
  const numbers = digits(value, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

export function maskCep(value: string) {
  const numbers = digits(value, 8);
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

export function maskPhone(value: string) {
  const numbers = digits(value, 11);
  if (!numbers) return "";
  if (numbers.length < 3) return `(${numbers}`;
  const ddd = numbers.slice(0, 2);
  const rest = numbers.slice(2);
  if (numbers.length < 7) return `(${ddd}) ${rest}`;
  if (numbers.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
