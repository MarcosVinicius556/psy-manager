# Integração Google Agenda

Cada profissional pode conectar a própria conta Google e escolher se deseja enviar atendimentos do Psy Manager para o Google Agenda e/ou exibir eventos do Google como horários ocupados na agenda interna.

## Pré-requisitos no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) no projeto `clinic-manager-ed887` (ou outro projeto vinculado ao app).
2. Ative a **Google Calendar API** em *APIs e serviços → Biblioteca*.
3. Configure a **tela de consentimento OAuth** (tipo Externo ou Interno, conforme o público):
   - Adicione os escopos `.../auth/calendar.events` e `.../auth/calendar.readonly`.
   - Publique o app ou mantenha usuários de teste enquanto estiver em desenvolvimento.
4. Em *APIs e serviços → Credenciais*, crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**.
5. Em **URIs de redirecionamento autorizados**, inclua:
   - `http://localhost:3000/api/integrations/google-calendar/auth/callback`
   - `https://psy-manager-dev.vercel.app/api/integrations/google-calendar/auth/callback`
   - `https://psy-manager-eta.vercel.app/api/integrations/google-calendar/auth/callback`
6. Anote o **Client ID** e o **Client secret**.

## Variáveis de ambiente (Vercel / `.env.local`)

| Variável | Onde | Descrição |
|----------|------|-----------|
| `GOOGLE_OAUTH_CLIENT_ID` | Servidor | Client ID OAuth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Servidor | Client secret OAuth |
| `GOOGLE_OAUTH_REDIRECT_URI` | Servidor (opcional) | Se omitida, o callback usa `{origem da requisição}/api/integrations/google-calendar/auth/callback` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Servidor | Chave para criptografar refresh tokens (32 bytes em base64 ou hex de 64 caracteres, ou string longa derivada com SHA-256) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Servidor | JSON completo da conta de serviço **ou** use `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` |
| `FIREBASE_CLIENT_EMAIL` | Servidor | E-mail da conta de serviço (alternativa ao JSON) |
| `FIREBASE_PRIVATE_KEY` | Servidor | Chave privada da conta de serviço (`\n` escapados no Vercel) |

As variáveis `NEXT_PUBLIC_*` do Firebase continuam necessárias para o cliente. **Não** use `NEXT_PUBLIC_` para segredos do Google ou da conta de serviço.

Gere uma chave de criptografia, por exemplo:

```bash
openssl rand -base64 32
```

## Firestore

Tokens e configuração sensível ficam em `integrations/{uid}`, com regras que negam leitura/escrita pelo cliente. Apenas o Admin SDK no servidor acessa essa coleção.

## Profissional vs consultório compartilhado

- **Por profissional** (`integrations/{uid}`): cada login conecta a própria conta Google. A sincronização usa sempre o **profissional responsável** do atendimento (`professionalId`), não quem criou o registro. Colegas em um local compartilhado veem apenas **Ocupado** na agenda do sistema.
- **Por consultório** (`integrations/loc_{locationId}`): opcional, configurado pelo criador do local em **Locais → [consultório]**. Replica agendamentos da sala para um calendário Google da sala (títulos genéricos, sem dados clínicos).

## Fluxo do usuário

1. Em **Configurações → Integrações → Google Agenda**, toque em **Conectar Google Agenda**.
2. Após o consentimento OAuth (`access_type=offline`, `prompt=consent`), escolha o calendário de destino.
3. Ative **Enviar atendimentos**, **Mostrar eventos do Google**, **Bloquear horários ocupados** e, se quiser, **Mostrar títulos** (só para você).
4. Em um **local compartilhado**, o criador pode vincular o calendário da sala na página do consultório.
5. Para desconectar, use **Desconectar** (revoga o token no Google e apaga credenciais no Firestore).

Se as variáveis de servidor não estiverem configuradas, o card mostra **Integração indisponível** e o restante do sistema continua funcionando.

## Privacidade (LGPD)

Por padrão, eventos no Google usam o título genérico **Atendimento**. O profissional pode optar por incluir apenas o **primeiro nome** do paciente. Dados clínicos não são enviados ao Google.

## Deploy das regras

Após alterar `firestore.rules`, publique com:

```bash
firebase deploy --only firestore:rules
```
