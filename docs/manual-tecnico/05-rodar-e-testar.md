# 5. Rodar e testar

## Local

```bash
npm ci
cp .env.example .env.local   # preencha o Firebase (sem commitar)
npm run dev                   # http://localhost:3000
```

Requisitos: Node.js 24 (`.nvmrc`), Java 21+ para os emuladores do Firebase.

## Checagens (as mesmas do CI)

| Comando | O que faz |
| --- | --- |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run verify:ui` | Padrão visual (sem pílulas, raios fixos) |
| `npm test` | Testes de unidade (Vitest) — inclui CRP, regras de falta e tours |
| `npm run test:rules` | Regras do Firestore no emulador |
| `npm run build` | Build de produção |
| `npm run verify` | Tudo acima, em sequência |
| `npm run backup:verify` | Exporta e restaura no emulador (job `backup-verify`) |

Se as portas padrão do emulador (8080/9099) estiverem ocupadas, rode com outro arquivo de configuração: `npx firebase emulators:exec --config <outro-firebase.json> --only firestore "npx vitest run --config vitest.rules.config.ts"`.

## E2E e screenshots

- `npm run e2e:mobile` — sobe emuladores, cria dados de demonstração (`npm run e2e:seed`) e tira screenshots no celular ([e2e-mobile.md](../e2e-mobile.md)).
- `npm run e2e:support-tickets` — fluxo de chamados.

## Ambiente de teste (develop)

- URL: https://psy-manager-dev.vercel.app (Deployment Protection ligada).
- Automação/smoke test: enviar o header `x-vercel-protection-bypass` com o segredo de automação configurado na Vercel (o valor nunca vai para o repositório).
- Para outra pessoa ver: gerar um link de compartilhamento na Vercel (expira).
- Depois do merge em `develop`, confira o status `Vercel – psy-manager` no commit antes de testar.
