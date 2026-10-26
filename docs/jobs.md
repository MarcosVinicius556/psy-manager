# Jobs diários (cron)

O Vercel Hobby permite **até 2 crons**, cada um **no máximo uma vez por dia**. O Psy Manager usa **um dispatcher** em `/api/cron/daily` (ver `vercel.json`), protegido por `CRON_SECRET` no header `Authorization: Bearer …`.

## Como funciona

1. A rota chama `runDailyDispatcher` (`src/lib/server/cron/runner.ts`).
2. Cada job tem um `id`, limite de lote (`batchLimit`) e função `run`.
3. O marcador de idempotência fica em `cronRuns/{jobId_aaaammdd}` (somente servidor; regras negam cliente).
4. Se o job do dia já está `completed`, uma segunda execução no mesmo dia **não reenvia** e-mails nem duplica efeitos.

## Registrar um job novo

1. Crie `src/lib/server/cron/jobs/meu-job.ts` exportando um `DailyCronJob`:

```ts
import type { DailyCronJob } from "../runner";

export const meuJob: DailyCronJob = {
  id: "meu_job",
  batchLimit: 200,
  async run(db, { cursor, now }) {
    // use cursor para retomar lotes grandes
    return { processed: 0, cursor: null, details: {} };
  },
};
```

2. Inclua o job em `dailyCronJobs` em `src/lib/server/cron/daily-jobs.ts` (ordem = ordem de execução).
3. Documente variáveis de ambiente ou coleções tocadas neste arquivo.
4. Adicione teste unitário se houver lógica não trivial.
5. **Não** adicione outra entrada em `vercel.json` — o dispatcher já existe.

## Jobs atuais (Onda 0)

| ID | Descrição |
| --- | --- |
| `trial_notifications` | Avisos de fim de trial (contas `trial_ativo` / `trial_expirado`). |
| `session_reminders` | Lembretes de sessão do dia seguinte (e-mail com confirmação em um clique). |
| `billing_renewals` | Renovação da assinatura Pix: avisos D-5/D-0, `pagamento_pendente` / `pagamento_atrasado` após vencimento e carência. |
| `payment_reminders` | Lembretes de cobrança a pacientes (D0, D+1, D+7; máx. 2 por `payments/{id}`). |
| `cleanup_expired` | Remove `sessionFeedbacks` e `sessionConfirmations` expirados (substituto de TTL pago). |

## Compatibilidade

`/api/cron/trial-notifications` ainda responde, mas apenas executa o job `trial_notifications` via o mesmo runner. Prefira o dispatcher `/api/cron/daily`.
