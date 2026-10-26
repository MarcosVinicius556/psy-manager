# PWA e Web Push (painel do profissional)

O painel em `/admin` pode ser instalado como app (PWA) e receber notificações push genéricas (sem nome de paciente na tela bloqueada).

## Manifest

O arquivo `src/app/manifest.ts` substitui `public/site.webmanifest`. O `start_url` aponta para `/admin`.

## Service worker

`public/sw.js` registra apenas push e clique na notificação. **Não** faz cache de respostas de API nem de dados clínicos.

## Variáveis de ambiente (VAPID)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VAPID_PRIVATE_KEY` | Sim (para push) | Chave privada VAPID |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ou `VAPID_PUBLIC_KEY` | Sim (para push) | Chave pública (exposta ao cliente para `subscribe`) |
| `VAPID_SUBJECT` | Não | Contato do remetente (padrão: `mailto:suporte@psymanager.com.br`) |

Se as chaves estiverem ausentes, o app continua funcionando: o botão de push mostra aviso e o servidor ignora envios.

### Gerar chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Copie `publicKey` para `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `privateKey` para `VAPID_PRIVATE_KEY` (somente no servidor / Vercel).

## Firestore

| Caminho | Acesso cliente |
|---------|----------------|
| `pushTokens/{uid}/devices/{id}` | O próprio usuário grava `subscription` e `plataforma` |
| `users/{uid}.pushPrefs` | Preferências de tipos de push e silêncio noturno |

Tokens inválidos (HTTP 410/404) são removidos no envio.

## iOS

Push no iPhone exige iOS 16.4+ e o app instalado na tela inicial (Adicionar à Tela de Início no Safari).
