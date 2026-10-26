/** GAD-7 — domínio público (Spitzer et al.). Pontuação 0–21. */

export const GAD7_QUESTIONS = [
  "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
  "Não conseguir parar ou controlar a preocupação",
  "Preocupar-se demais com diversas coisas",
  "Dificuldade para relaxar",
  "Ficar tão agitado(a) que é difícil ficar parado(a)",
  "Ficar facilmente irritado(a) ou aborrecido(a)",
  "Sentir medo como se algo horrível fosse acontecer",
] as const;

const OPTIONS = ["0", "1", "2", "3"] as const;

export function scoreGad7(respostas: Record<string, string>) {
  let total = 0;
  for (let i = 1; i <= 7; i += 1) {
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
  else faixa = "Grave";
  return { ok: true as const, pontuacao: total, faixa };
}
