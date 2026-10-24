# Testes mobile (Playwright + emuladores Firebase)

Os testes **não** usam Firebase de produção. Tudo roda contra Auth (9099) e Firestore (8080) locais.

## Pré-requisitos

- Node 24
- `npm ci`
- Java (para o emulador Firestore) — já disponível no ambiente Cloud Agent

## Variáveis

Copie `docs/e2e-env.example` para `.env.e2e.local` se quiser sobrescrever. O script `e2e:mobile` injeta valores demo automaticamente.

| Variável | Default |
| --- | --- |
| `E2E_DEMO_EMAIL` | `demo@clinica.test` |
| `E2E_DEMO_PASSWORD` | `Demo123456!` |
| `FIREBASE_PROJECT_ID` | `demo-psy-manager` |

## Comandos

```bash
# Fluxo completo: emuladores + seed + build + servidor + Playwright (4 viewports)
npm run build
npm run e2e:mobile
```

Somente seed (com emuladores já rodando):

```bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
npx tsx scripts/e2e/seed-emulator.ts
```

## Artefatos

- Screenshots: `artifacts/screenshots/after/<viewport>/`
- Relatório HTML: `artifacts/playwright-report/`

## Login manual no painel demo

1. `npx firebase emulators:start --only auth,firestore --project demo-psy-manager`
2. Seed (comando acima)
3. `npm run dev` com `NEXT_PUBLIC_FIREBASE_EMULATOR=true` e as `NEXT_PUBLIC_*` do `docs/e2e-env.example`
4. Entrar em `/admin/login` com o e-mail/senha demo
