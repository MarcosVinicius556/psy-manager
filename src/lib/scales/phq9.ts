/** PHQ-9 — domínio público (Pfizer, uso livre com crédito). Pontuação 0–27. */

export const PHQ9_QUESTIONS = [
  "Pouco interesse ou prazer em fazer as coisas",
  "Sentir-se para baixo, deprimido(a) ou sem perspectiva",
  "Dificuldade para pegar no sono, permanecer dormindo ou dormir demais",
  "Sentir-se cansado(a) ou com pouca energia",
  "Falta de apetite ou comer em excesso",
  "Sentir-se mal consigo mesmo(a) — ou que é um fracasso ou decepcionou a família",
  "Dificuldade para se concentrar (ler, assistir TV, etc.)",
  "Lentidão para se movimentar ou falar, ou agitação (inquietude)",
  "Pensamentos de que seria melhor estar morto(a) ou de se machucar de alguma forma",
] as const;

export type Phq9Answers = Record<`q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`, string>;

const OPTIONS = ["0", "1", "2", "3"] as const;

export function scorePhq9(respostas: Record<string, string>) {
  let total = 0;
  for (let i = 1; i <= 9; i += 1) {
    const raw = respostas[`q${i}`]?.trim();
    if (!OPTIONS.includes(raw as (typeof OPTIONS)[number])) {
      return { ok: false as const, reason: `Resposta inválida na questão ${i}.` };
    }
    total += Number.parseInt(raw!, 10);
  }
  let faixa: string;
  if (total <= 4) faixa = "Mínima";
  else if (total <= 9) faixa = "Leve";
  else if (total <= 14) faixa = "Moderada";
  else if (total <= 19) faixa = "Moderadamente grave";
  else faixa = "Grave";
  return { ok: true as const, pontuacao: total, faixa };
}
