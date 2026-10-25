# Integração de e-mail por profissional

Cada profissional pode conectar a própria conta Gmail para enviar confirmações de pagamento, contratos, recibos e lembretes. As credenciais ficam criptografadas no Firestore (`emailIntegrations/{uid}`), acessíveis apenas pelo Admin SDK nas rotas de API do Next.js.

## Modos de conexão e variáveis de ambiente

| Modo | O que o profissional faz | Variáveis obrigatórias no servidor | Observações |
|------|--------------------------|-----------------------------------|-------------|
| **Gmail OAuth** | Clica em “Conectar Gmail” e autoriza o escopo `gmail.send` | `EMAIL_CREDENTIALS_ENC_KEY`, `NEXT_PUBLIC_PROJECT_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`) | Opcional: `EMAIL_OAUTH_REDIRECT_URI` (padrão: `{origem}/api/integrations/email/auth/callback`) |
| **Gmail SMTP (senha de app)** | Informa e-mail Gmail + senha de app de 16 caracteres | `EMAIL_CREDENTIALS_ENC_KEY`, `NEXT_PUBLIC_PROJECT_ID`, Firebase Admin (mesmo que acima) | **Não** exige OAuth do Google; útil quando só a criptografia e o Admin SDK estão prontos |

Se faltar configuração, o painel mostra uma mensagem genérica ao profissional. Detalhes técnicos (nomes de variáveis) vão apenas para logs do servidor (`[email-integration]`).

## Pré-requisitos no Google Cloud (OAuth)

Reutilize o mesmo **ID do cliente OAuth** da integração Google Agenda (`GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`).

1. Ative a **Gmail API** em *APIs e serviços → Biblioteca*.
2. Na **tela de consentimento OAuth**, adicione o escopo sensível:
   - `https://www.googleapis.com/auth/gmail.send`
   - (O fluxo também solicita `openid` e e-mail para exibir a conta conectada.)
3. Em **URIs de redirecionamento autorizados**, inclua:
   - `http://localhost:3000/api/integrations/email/auth/callback`
   - `https://<seu-dominio>/api/integrations/email/auth/callback`
4. **Modo de teste**: até 100 usuários de teste podem autorizar escopos sensíveis sem verificação completa. Adicione os e-mails dos profissionais em *Usuários de teste*.
5. **Produção**: envie o app para verificação do Google explicando que o escopo `gmail.send` é usado somente para o profissional enviar e-mails aos próprios pacientes (sem leitura da caixa de entrada). Consulte a [documentação de verificação](https://support.google.com/cloud/answer/9110914).

A autorização do Google Agenda e a do Gmail são **concessões separadas** (tokens em coleções diferentes). O parâmetro `include_granted_scopes=true` permite autorização incremental sem revogar o calendário.

## Alternativa: senha de app (SMTP)

Sem OAuth, o profissional pode usar **Gmail SMTP** (`smtp.gmail.com:465`) com uma [senha de app](https://myaccount.google.com/apppasswords) (exige verificação em duas etapas). A senha é armazenada criptografada; o cliente nunca a vê após salvar.

## Variáveis de ambiente (referência)

| Variável | Onde | Descrição |
|----------|------|-----------|
| `EMAIL_CREDENTIALS_ENC_KEY` | Servidor | Chave AES-256-GCM para refresh tokens e senhas de app (32 bytes em base64 ou hex de 64 caracteres, ou string longa derivada com SHA-256) |
| `EMAIL_OAUTH_REDIRECT_URI` | Servidor (opcional) | Se omitida, usa `{origem}/api/integrations/email/auth/callback` |
| `GOOGLE_OAUTH_CLIENT_ID` | Servidor | Cliente OAuth (modo Gmail OAuth) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Servidor | Secret OAuth (modo Gmail OAuth) |
| `NEXT_PUBLIC_PROJECT_ID` | Servidor + cliente | Identificador do projeto Firebase |
| `FIREBASE_SERVICE_ACCOUNT_JSON` ou `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` | Servidor | Admin SDK |

Gere a chave de criptografia:

```bash
openssl rand -base64 32
```

## Firestore

| Coleção | Acesso cliente | Conteúdo |
|---------|----------------|----------|
| `emailIntegrations/{uid}` | Negado | Tokens e senhas criptografados |
| `emailTemplates/{id}` | Titular (`ownerUid`) | Modelos versionados |
| `emailLog/{id}` | Leitura titular | Histórico de envios |
| `emailAutomationMarkers/{id}` | Negado | Idempotência (ex.: confirmação de pagamento) |

## Envio automático

- **Confirmação de pagamento**: opt-in por modelo (`autoSend` no gatilho `confirmacao_pagamento`). Disparado na rota `POST /api/payments/{id}/receive` quando o status passa a `pago`, com marcador idempotente por pagamento.
- **Lembrete de sessão**: envio manual por enquanto; um cron dedicado pode ser adicionado depois (mesmo padrão `CRON_SECRET` do trial).

## Privacidade

Notas clínicas e conteúdo de prontuário **não** entram em e-mails. Colegas em locais compartilhados não veem configurações nem histórico de e-mail de outro profissional.
