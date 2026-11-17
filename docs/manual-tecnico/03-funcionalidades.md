# 3. Funcionalidades e integrações

## Crons

A Vercel chama `/api/cron/daily` uma vez por dia (`vercel.json`, 11:00 UTC = 08:00 em Brasília), autenticado por `CRON_SECRET`. O dispatcher (`src/lib/server/cron/runner.ts`) roda os jobs de `src/lib/server/cron/daily-jobs.ts` em ordem, com idempotência em `cronRuns/{job_aaaammdd}`:

| Job | O que faz |
| --- | --- |
| `trial_notifications` | Avisos de fim de trial |
| `activation_nudges` | E-mails de ativação (D+2 e D+5) |
| `billing_renewals` | Renovação da assinatura Pix da plataforma |
| `session_reminders` | Lembrete da sessão do dia seguinte com confirmação em um clique |
| `payment_reminders` | Lembretes de cobrança ao paciente (D0, D+1, D+7; máx. 2 por cobrança) |
| `booking_availability` | Recalcula a disponibilidade do agendamento público |
| `booking_cleanup` | Limpa pedidos de agendamento recusados antigos |
| `cleanup_expired` | Remove links de feedback/confirmação expirados |

Detalhes e como criar um job: [jobs.md](../jobs.md).

## Integrações

| Integração | Onde | Doc |
| --- | --- | --- |
| Google Calendar / Meet | `src/lib/google-calendar`, `/api/integrations/google-calendar` | [google-calendar.md](../google-calendar.md) |
| E-mail (SMTP da plataforma, Gmail OAuth/SMTP por profissional) | `src/lib/email-integration`, `/api/integrations/email` | [email.md](../email.md) |
| Cloudinary (avatares e anexos) | `src/lib/cloudinary`, `/api/image`, `/api/media` | [security/cloudinary-assets.md](../security/cloudinary-assets.md) |
| Web Push | `src/lib/push`, `/api/push` | [pwa.md](../pwa.md) |
| Suporte (bot "Chamados") | `/api/support`, `SUPPORT_BOT_TOKEN` | [support-tickets.md](../support-tickets.md) |
| Backup | `.github/workflows/firestore-backup.yml`, `scripts/backup` | [backup.md](../backup.md) |

## Portal do paciente e códigos de vínculo

- Rotas em `/paciente/*` (início, sessões, pagamentos, tarefas, diário, mural, documentos, escalas, conexões, configurações). Shell: `src/components/patient/PatientPortalShell.tsx`.
- O paciente cria a própria conta (e-mail/senha, Google ou link por e-mail) em `patientAccounts/{uid}`.
- O(a) psicólogo(a) gera um **código de vínculo** na ficha do paciente (`/api/patient-portal/link-code`). O código tem 8 caracteres (alfabeto sem 0/O/1/I), é mostrado como `XXXX-XXXX`, vale **7 dias** e só o **hash SHA-256** é gravado em `patientLinkCodes/{hash}`. Gerar um novo revoga os pendentes do mesmo paciente.
- O paciente digita o código no portal; o servidor valida (com limite de tentativas em `apiPatientLinkCodeRateLimits`), cria `patientConnections` e registra em `patientLinkCodeAudit`. Um paciente pode ter várias conexões (vários profissionais).
- Também existe convite por link (`portalInvites`). Código: `src/lib/server/patient-portal/`.

## Cobrança e Pix

- **Consultório → paciente:** cobranças em `payments`. O Pix copia e cola/QR é gerado no cliente (`src/lib/pix/brcode.ts`) com a chave do profissional (`memberPrivate`), tipo detectado automaticamente (`src/lib/pix/keys.ts`) e `pixTxid` por cobrança. Não há gateway: o profissional confirma o pagamento manualmente. Recibos em PDF e relatório Receita Saúde em `/admin/financeiro/receita-saude`.
- **Plataforma → profissional (assinatura):** Pix com a chave da plataforma em `PSY_BILLING_PIX_*` (`src/lib/billing/platform-pix.ts`), renovação pelo job `billing_renewals`. Ver [saas.md](../saas.md).

## Regras de cobrança por falta

Cada psicólogo(a) configura as próprias regras em **Configurações › Valores da consulta › Regras de cobrança por falta** (não por paciente, e sem menu novo). Código: `src/lib/admin/no-show-rules.ts` (lógica pura e testada), `src/components/admin/NoShowRulesEditor.tsx` (tela), `clinic-context.tsx` (`setAppointmentStatus`, `createNoShowCharge`, `waiveNoShowCharge`, `updateAbsenceJustification`).

### Configuração (`members.regrasFalta`)

| Campo | Significado |
| --- | --- |
| `automatico` | Cria (ou deixa de criar) a cobrança sozinho ao registrar a falta |
| `semJustificativa` | `{ cobrar, tipo: "percentual" \| "fixo", valor }` — falta sem justificativa |
| `comJustificativa` | Idem, para falta justificada (padrão: não cobra) |
| `limiteJustificadas` | `{ ativo, quantidade, periodoDias, cobranca }` — tolera N faltas justificadas no período; da N+1ª em diante usa `cobranca` |

`percentual` é sobre o valor da sessão: valor social do profissional se a sessão for social, senão o valor do atendimento, senão o valor base.

### Fluxo

1. No atendimento, "Não compareceu" abre o formulário: **justificada / sem justificativa** + texto.
2. `evaluateNoShow()` escolhe a regra: sem justificativa → `semJustificativa`; justificada com o limite ativo e `justificadasNoPeriodo >= quantidade` → `limiteJustificadas.cobranca`; senão → `comJustificativa`. A contagem considera faltas justificadas do **mesmo paciente com o mesmo profissional**, nos `periodoDias` anteriores à data do atendimento (sem contar o próprio). Ela usa os atendimentos já carregados no painel.
3. Com `automatico`, a cobrança é criada em `payments` (status `nao_pago`, vencimento hoje, título "Falta sem justificativa" / "Falta justificada (acima do limite)") com `regraFalta`; se a regra não cobra, nada é criado. A decisão fica em `appointments.faltaCobranca`.
4. O card **Cobrança por falta** no atendimento mostra a regra aplicada e permite: cobrar o valor sugerido, cobrar outro valor (ajuste manual, registrado como `manual`), não cobrar ou **dispensar** uma cobrança aberta (remove a cobrança não paga). Cobrança paga não é removida.
5. A justificativa pode ser corrigida depois ("Editar"); a cobrança não muda sozinha — o card mostra a nova sugestão para revisão.
6. Em Contas a receber, a linha da cobrança mostra "Regra: …".

### Compatibilidade

- Quem nunca salvou `regrasFalta` continua com a política antiga (`politicaFalta`: aviso mínimo + %), aplicada como **sugestão manual**, como antes.
- Ao salvar as regras, `politicaFalta.percentual` é sincronizado com a regra "sem justificativa" para manter a variável `{{POLITICA_FALTA}}` do contrato e clientes antigos coerentes.
- Faltas antigas sem `faltaJustificada` aparecem como "sem classificação" e são tratadas como não justificadas na sugestão.

## CRP

`src/lib/admin/crp.ts` tem a lista oficial do Conselho Federal de Psicologia (24 regionais, conferida em 11/11/2026 em transparencia.cfp.org.br): 01 DF, 02 PE, 03 BA, 04 MG, 05 RJ, 06 SP, 07 RS, 08 PR, 09 GO, 10 PA/AP, 11 CE, 12 SC, 13 PB, 14 MS, 15 AL, 16 ES, 17 RN, 18 MT, 19 SE, 20 AM/RR, 21 PI, 22 MA, 23 TO, 24 RO/AC. O valor gravado continua sendo o número da regional (`crpRegiao`, "01".."24"). Em Configurações, a região é sugerida pela UF do endereço quando está vazia, e um aviso aparece quando a região não cobre a UF (útil para quem escolheu pela lista antiga, que tinha números trocados).
