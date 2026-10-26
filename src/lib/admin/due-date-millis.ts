/** Meia-noite local do vencimento (yyyy-mm-dd), em milissegundos. */
export function dueDateMillis(dueDate: string) {
  if (!dueDate || dueDate.length < 10) return 0;
  const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number);
  if ([year, month, day].some((n) => Number.isNaN(n))) return 0;
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}
