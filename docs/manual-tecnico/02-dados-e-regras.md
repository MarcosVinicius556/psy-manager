# 2. Dados e segurança

## Projeto Firebase

- Projeto único: **`clinic-manager-ed887`**, compartilhado por develop e produção (ver [parte 1](01-arquitetura.md#ambientes)).
- Authentication: e-mail/senha, Google, link por e-mail (portal do paciente). MFA por TOTP depende do upgrade para Identity Platform (ver [mfa.md](../mfa.md)).
- Firestore: regras em `firestore.rules`, índices em `firestore.indexes.json`.
- As rotas `/api/*` usam `firebase-admin` com a service account configurada nas variáveis do servidor.

## Modelo multi-tenant

Quase todo documento do consultório tem `ownerUid` (dono da conta). Documentos compartilhados entre colegas de sala usam `accessUids` (lista de quem pode ler). Secretárias não leem o Firestore direto: passam por `/api/tenant/*`, que valida o vínculo (`staffMembers`) e as permissões (`agenda`, `pacientes`, `financeiro`).

Dados sensíveis do profissional (CPF, CRP, endereço, Pix) ficam em `memberPrivate/{uid}`, não em `members` (as regras barram esses campos em `members`). Observações e contato de emergência do paciente ficam em `patientPrivate`. A ficha clínica fica em `clinicalRecords`, separada de `appointments`.

## Coleções principais

| Coleção | Conteúdo |
| --- | --- |
| `users/{uid}` | Perfil de acesso (papel: `psicologo`, `secretaria`, `super_admin`, `support`), conta SaaS (trial/assinatura). Subcoleções `inbox`, `billingEvents` |
| `members` | Profissionais do consultório: nome, valores (`valorBase`, `valorSocial`), turnos (`workHours`), `politicaFalta` (legado), **`regrasFalta`** (regras de falta) |
| `memberPrivate/{uid}` | CPF, CRP (`crpNumero`, `crpRegiao`), endereço, Pix do profissional |
| `patients`, `patientPrivate` | Cadastro do paciente e campos reservados |
| `appointments` | Atendimentos: data/hora, valor, status (`agendado`, `em_andamento`, `concluido`, `cancelado`, `faltou`), confirmação, Google Calendar, **campos de falta** |
| `clinicalRecords` | Ficha clínica por atendimento (campos clínicos podem ser criptografados) |
| `payments` | Contas a receber: valor, vencimento (`dueDate`, `dueDateMillis`), status (`agendado`, `em_haver`, `pago`, `nao_pago`), histórico, recibo fiscal, `pixTxid`, **`regraFalta`** |
| `packages` | Pacotes de sessões |
| `expenses` | Contas a pagar (com rateio entre colegas) |
| `locations`, `locationInvites` | Locais/salas e convites de compartilhamento |
| `notifications` | Avisos de cobrança para o profissional |
| `contractTemplates`, `emailTemplates`, `clinicalNoteTemplates`, `formTemplates`, `reportTemplates`, `reportRuns` | Modelos e relatórios |
| `signatureRequests`, `formRequests`, `formResponses`, `consentRecords`, `legalAcceptances` | Assinatura de contrato, formulários e aceites |
| `sessionFeedbacks`, `sessionConfirmations` | Links públicos de feedback e confirmação de sessão |
| `bookingProfiles`, `bookingAvailability`, `bookingRequests` | Agendamento público |
| `staffMembers`, `staffInvites`, `clinics`, `clinicInvites` | Equipe (secretárias) e clínica |
| `supervisionShares`, `supervisionExportLog` | Supervisão |
| `patientAccounts`, `patientConnections`, `patientLinkCodes`, `patientLinkCodeAudit`, `portalInvites` | Portal do paciente e vínculos |
| `patientJournal`, `patientTasks`, `patientMural` | Diário, tarefas e mural do portal |
| `pushTokens/{uid}/devices` | Inscrições de Web Push |
| `supportTickets` (+ `messages`, `history`, `attachments`, `botExecutions`), `supportTicketCounters` | Chamados de suporte |
| `plans`, `trialClaims`, `trialNoticeMarkers`, `activationEvents`, `platformAudit`, `platformMessages` | SaaS e plataforma |
| `integrations`, `emailIntegrations`, `emailLog`, `emailAutomationMarkers` | Google Calendar e e-mail por profissional |
| `fechamentos` | Fechamento mensal Receita Saúde |
| `cronRuns`, `api*RateLimits`, `keys`, `directory`, `clinicalAccessLog` | Infra (idempotência de cron, limites, chaves, diretório de e-mails, log de acesso clínico) |

### Campos de falta (novos, opcionais e compatíveis)

| Documento | Campo | Tipo | Observação |
| --- | --- | --- | --- |
| `appointments` | `faltaJustificativa` | string | Já existia (texto livre) |
| `appointments` | `faltaJustificada` | boolean \| ausente | `true` justificada, `false` sem justificativa. Registros antigos não têm o campo (exibidos como "sem classificação") |
| `appointments` | `faltaCobranca` | map \| ausente | `{ codigo, descricao, valor, paymentId, situacao, manual, avaliadoEm }` — decisão da regra. `situacao`: `cobrada`, `dispensada`, `sem_cobranca`, `pendente` |
| `payments` | `regraFalta` | map \| ausente | `{ codigo, descricao, manual }` — regra que gerou a cobrança, mostrada no financeiro |
| `members` | `regrasFalta` | map \| ausente | Regras do profissional (ver [parte 3](03-funcionalidades.md#regras-de-cobrança-por-falta)) |

Nenhum desses campos exigiu mudança em `firestore.rules`: as regras de `appointments`, `payments` e `members` não restringem chaves extras e continuam validando dono, campos clínicos, confirmação e `politicaFalta`. Clientes de produção (master) ignoram os campos novos.

## Regras do Firestore

- Arquivo: `firestore.rules`. Testes: `src/firestore.rules.test.ts` e `src/firestore.rules.compat.test.ts` (`npm run test:rules`, roda no emulador).
- Blocos `// compat` mantêm o cliente de `master` funcionando enquanto `develop` está à frente. Remover depois que `develop` for promovida para `master`.
- Preferir consultas de igualdade simples (`where("ownerUid", "==", uid)`) com ordenação em memória; **evitar índices compostos novos**.

### Publicar regras (processo)

As regras **não** são publicadas pelo CI nem pela Vercel. O processo é manual, feito por quem tem a service account do projeto (os scripts de apoio ficam fora do repositório, na máquina de operação):

1. Validar no emulador: `npm run test:rules` e um harness que exercita o cliente de `master` e o de `develop` contra as regras novas (produção e teste compartilham o projeto).
2. Fazer backup do ruleset publicado (GET em `projects/clinic-manager-ed887/releases/cloud.firestore` + o ruleset apontado), salvo em JSON.
3. Publicar pela Firebase Rules REST API: `POST /v1/projects/<id>/rulesets` com o conteúdo de `firestore.rules` e `PATCH /v1/projects/<id>/releases/cloud.firestore` apontando para o ruleset novo. (Alternativa: `firebase deploy --only firestore:rules`.)
4. Em caso de problema, reapontar o release para o ruleset anterior (rollback).

Índices: `firestore.indexes.json` é publicado à parte (Firebase CLI `firebase deploy --only firestore:indexes` com uma conta com papel de administrador de índices).

## Variáveis de ambiente (somente nomes)

Configuradas no dashboard da Vercel por ambiente (Production = master, Preview = develop/feature). Lista base em `.env.example`.

| Grupo | Variáveis |
| --- | --- |
| Firebase cliente (públicas) | `NEXT_PUBLIC_API_KEY`, `NEXT_PUBLIC_AUTH_DOMAIN`, `NEXT_PUBLIC_PROJECT_ID`, `NEXT_PUBLIC_STORAGE_BUCKET`, `NEXT_PUBLIC_MESSAGE_SENDER_ID`, `NEXT_PUBLIC_APP_ID`, `NEXT_PUBLIC_MEASUREMENT_ID` |
| Firebase servidor | `FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` |
| Site | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_FEATURE_*` (flags) |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| E-mail da plataforma | `EMAIL_TO`, `GMAIL_APP_PASSWORD`, `EMAIL_UNSUBSCRIBE_SECRET` |
| E-mail por profissional | `EMAIL_CREDENTIALS_ENC_KEY`, `EMAIL_OAUTH_REDIRECT_URI` |
| Google Calendar | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_TOKEN_ENCRYPTION_KEY` |
| Cron | `CRON_SECRET` |
| Suporte (bot) | `SUPPORT_BOT_TOKEN` |
| Assinatura Pix da plataforma | `PSY_BILLING_PIX_KEY`, `PSY_BILLING_PIX_KEY_TYPE`, `PSY_BILLING_PIX_NAME`, `PSY_BILLING_PIX_CITY` |
| Web Push | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| Criptografia clínica | `CLINICAL_FIELD_ENC_KEY` (não definida de propósito: afeta os dois ambientes) |
| Backup (GitHub Actions) | `FIREBASE_BACKUP_SERVICE_ACCOUNT`, `BACKUP_AGE_RECIPIENT` (segredos do repositório) |
| Emuladores / e2e | `NEXT_PUBLIC_FIREBASE_EMULATOR*`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `E2E_*`, `PLAYWRIGHT_BASE_URL` |
