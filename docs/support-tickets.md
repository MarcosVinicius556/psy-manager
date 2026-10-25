# Módulo de Suporte (Chamados)

## Visão geral

Chamados ficam na coleção `supportTickets` no Firestore. Usuários clínicos abrem e acompanham tickets em **Admin → Operacional → Suporte**. Equipe (`super_admin` e `support`) triagem em **Plataforma → Suporte**.

Todas as mutações sensíveis (status, bot, GitHub, histórico) passam por **rotas API Next.js** com Firebase Admin SDK. Regras do Firestore são **negar por padrão** para escrita direta.

O **Grok Bot** é um agente **externo** (4×/dia no próprio cron). Ele só conversa com o app via `/api/support/bot/*` usando `SUPPORT_BOT_TOKEN`. O app **não** chama LLM nem guarda credenciais de escrita no GitHub.

## Modelo de dados

Documento `supportTickets/{id}`:

| Campo | Descrição |
| --- | --- |
| `humanId` | Ex.: `CH-000123` (contador transacional `supportTicketCounters/global`) |
| `title`, `description`, `extraInfo`, `impact` | Texto sanitizado no servidor |
| `openedBy` | `{ uid, name, email, clinicId }` |
| `status`, `priority`, `classification` | Ver máquina de estados |
| `assignee` | `{ type: human\|bot, uid?, name }` |
| `github` | `issueUrl`, `prUrl`, `mergedAt`, etc. |
| `bot` | `state`, `lockId`, `lockExpiresAt`, `attempts`, … |
| `review` | `pending\|approved\|rejected` + motivo |
| `version` | Concorrência otimista |

Subcoleções (somente leitura no cliente; escrita via API):

- `messages` — thread (`authorType`, `idempotencyKey`, `source`)
- `history` — auditoria append-only
- `attachments` — metadados Cloudinary (`public_id`, mime, size)
- `botExecutions` — log de execuções do agente

## Máquina de estados

| De | Para (permitido) |
| --- | --- |
| `aberto` | `em_analise`, `aguardando_informacoes`, `encerrado` |
| `em_analise` | `aguardando_informacoes`, `em_desenvolvimento`, `resolvido`, `encerrado` |
| `aguardando_informacoes` | `em_analise` (automático quando o usuário responde) |
| `em_desenvolvimento` | `aguardando_aprovacao`, `em_analise` |
| `aguardando_aprovacao` | `reprovado`, `resolvido` (**somente** com merge de PR reportado) |
| `reprovado` | `em_desenvolvimento` |
| `resolvido` | `encerrado`, `reaberto` |
| `encerrado` | `reaberto` |
| `reaberto` | `em_analise` |

Transições inválidas retornam **409**. Implementação: `src/lib/support/transitions.ts` (testes unitários).

## Notificações

Eventos gravam em `users/{uid}/inbox/{support_{ticketId}_{eventId}}` (dedupe determinístico). Tipos incluem abertura, nova mensagem, mudança de status, pedido de informações, PR, falha do bot, etc.

## API do usuário (Bearer Firebase ID token)

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/support/tickets` | Lista meus chamados |
| POST | `/api/support/tickets` | Abre chamado (rate limit) |
| GET | `/api/support/tickets/{id}` | Detalhe + mensagens + histórico |
| POST | `/api/support/tickets/{id}/messages` | Resposta |
| POST | `/api/support/tickets/{id}/reopen` | Reabrir com motivo |
| POST | `/api/support/tickets/{id}/review` | Aprovar/reprovar PR (abridor ou staff) |
| POST | `/api/support/tickets/{id}/attachments` | Registrar anexos após upload |

## API admin (staff)

| Método | Rota |
| --- | --- |
| GET | `/api/support/admin/tickets?status=&priority=&…` |
| PATCH | `/api/support/admin/tickets/{id}` — prioridade, status, assignee, pausar bot |

## API do bot

Autenticação: `Authorization: Bearer <SUPPORT_BOT_TOKEN>` (comparação em tempo constante; rate limit por IP).

| Método | Rota | Notas |
| --- | --- | --- |
| GET | `/api/support/bot/queue` | Fila elegível; `?summary=1` → `{ count, maxUpdatedAt }` |
| POST | `/api/support/bot/tickets/{id}/claim` | Lock TTL; 409 se já bloqueado |
| POST | `/api/support/bot/tickets/{id}/release` | Body `{ lockId }` |
| GET | `/api/support/bot/tickets/{id}` | Contexto completo + URLs assinadas |
| POST | `/api/support/bot/tickets/{id}/messages` | `idempotencyKey` obrigatório |
| POST | `/api/support/bot/tickets/{id}/status` | Transição validada |
| POST | `/api/support/bot/tickets/{id}/classification` | |
| POST | `/api/support/bot/tickets/{id}/github` | Vincula issue/PR; idempotente por merge de campos |
| POST | `/api/support/bot/tickets/{id}/execution` | Após 3 falhas → `bot.state=failed` + aviso admins |

### Exemplo: fila resumida

```http
GET /api/support/bot/queue?summary=1
Authorization: Bearer <token>
```

```json
{ "count": 2, "maxUpdatedAt": "2026-10-25T12:00:00.000Z" }
```

### Exemplo: claim

```http
POST /api/support/bot/tickets/abc123/claim
Authorization: Bearer <token>
```

```json
{ "lockId": "uuid", "lockExpiresAt": "2026-10-25T12:30:00.000Z" }
```

### Exemplo: mensagem idempotente

```http
POST /api/support/bot/tickets/abc123/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "idempotencyKey": "run-2026-10-25-1-msg-1",
  "body": "Análise concluída: …"
}
```

## Rotina externa do Grok Bot (sugestão)

1. `GET queue?summary=1` — se `count === 0`, encerrar.
2. `GET queue` — ordenação já vem por prioridade/classificação/espera.
3. Para cada ticket: `POST claim` → `GET` contexto → trabalho no GitHub **fora do app** → `POST github` / `messages` / `status` → `POST execution` → `POST release`.
4. Em falha repetida, confiar em `/execution` para marcar `failed` e notificar humanos.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `SUPPORT_BOT_TOKEN` | Bearer do agente externo (servidor apenas) |
| Firebase Admin / Cloudinary | Mesmas do restante do app |

Não commitar valores reais (GitGuardian).

## Índices Firestore

Ver `firestore.indexes.json` (consultas por `openedBy.uid`, `status`, `priority`, `classification` + `updatedAt`; collection group `messages.idempotencyKey`).

## Limitações conhecidas

- Papel `support` acessa só **Plataforma → Suporte** (não indicadores/contas).
- Cron Vercel Hobby: automação do bot **não** depende do cron do app.
- Revisor de PR: abridor do chamado ou staff; merge real ainda precisa ser reportado via bot para `resolvido` a partir de `aguardando_aprovacao`.
