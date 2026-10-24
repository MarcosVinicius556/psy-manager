# Psy Manager

Painel de gestão para consultórios de psicologia: agenda, pacientes, financeiro, contratos e relatórios. O acesso público cria uma conta com 30 dias de avaliação. A operação da plataforma fica em `/plataforma`.

## Fluxo de branches e deploy

```text
feature/* ou fix/*  →  PR  →  develop  →  PR  →  master
                                 │                  │
                           Preview (staging)    Production
```

| Branch | Ambiente | O que a Vercel faz |
| --- | --- | --- |
| `master` | Produção | Deploy de Production, com a Production Branch do projeto em `master` |
| `develop` | Teste / staging | Deploy de Preview |
| `feature/**`, `fix/**`, `hotfix/**` | Preview | Deploy de Preview. O pull request usa esse mesmo deploy |
| Qualquer outra | — | Nenhum deployment |

`git.deploymentEnabled` decide pelo nome da branch. Um preview de pull request é o deploy da branch de origem, então `feature/**`, `fix/**` e `hotfix/**` precisam continuar ligados. Desligar essas branches também desligaria o preview do PR. O push na branch de trabalho já gera o preview, mesmo antes de o PR ser aberto.

Hotfix urgente sai de `master` como `hotfix/*`, entra em `master` por PR e depois volta para `develop`. O passo a passo, os nomes de branch e os commits estão em [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

O arquivo `vercel.json` não guarda segredo. A Production Branch e as variáveis por ambiente continuam no dashboard da Vercel.

## Requisitos

- Node.js 24 (`.nvmrc`). As dependências `@firebase/*` pedem `>= 24.12.0`, e o `engines` do `package.json` pede `24.x`
- npm (o lockfile do projeto é `package-lock.json`)

## Começar

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Preencha o Firebase em `.env.local`. E-mail (`EMAIL_TO` e `GMAIL_APP_PASSWORD`) é opcional: sem ele, os avisos ficam só dentro do painel. O e-mail que aparece no site é `NEXT_PUBLIC_CONTACT_EMAIL`, separado da conta de SMTP.

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config, sem prompt) |
| `npm test` | `vitest run` |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build |
| `npm run e2e:mobile` | Emuladores Firebase + seed + screenshots Playwright (ver [docs/e2e-mobile.md](docs/e2e-mobile.md)) |

## Variáveis de ambiente

A lista completa está em [`.env.example`](.env.example).

| Variável | Onde vive | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_API_KEY`, `NEXT_PUBLIC_AUTH_DOMAIN`, `NEXT_PUBLIC_PROJECT_ID`, `NEXT_PUBLIC_STORAGE_BUCKET`, `NEXT_PUBLIC_MESSAGE_SENDER_ID`, `NEXT_PUBLIC_APP_ID`, `NEXT_PUBLIC_MEASUREMENT_ID` | Cliente | Configuração web do Firebase. É pública por desenho; a trava é `firestore.rules` e `storage.rules` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cliente | Nome do cloud, visível nas URLs |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Só servidor | Upload em `src/app/api/image/upload/route.ts`. Sem `NEXT_PUBLIC_` |
| `EMAIL_TO`, `GMAIL_APP_PASSWORD` | Só servidor | SMTP. Sem elas o e-mail não sai |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Cliente | E-mail público de contato |

Não existe gateway de pagamento nestas variáveis. A contratação não confirma pagamento até um provedor real ser ligado.

## Feature toggles

Flags opcionais no cliente, definidas em [`src/lib/feature-flags.ts`](src/lib/feature-flags.ts). Cada flag tem um default no código e pode ser ligada com `NEXT_PUBLIC_FEATURE_<NOME>=true` ou `1` (veja o registro no arquivo para o nome exato da variável).

| Flag | Variável | Default | Efeito |
| --- | --- | --- | --- |
| `dashboardCustomization` | `NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION` | desligada | Com a flag desligada, o início do admin mostra o dashboard padrão fixo, sem personalizar nem ler/gravar layout salvo. Ligada, mantém o comportamento de personalização. |

Na Vercel, defina a variável no ambiente desejado (Preview, Production) e faça um novo deploy para o valor entrar no build.

## Testes e CI

```bash
npm run typecheck
npm run lint
npm test
```

O GitHub Actions roda esses comandos e o `next build` em pull request e em push para `develop` e `master`. O build do CI usa placeholders e não precisa dos segredos reais.

## Antes de usar em produção

Publique `firestore.rules` e `storage.rules` (`firebase deploy --only firestore:rules,storage`) e crie o documento do proprietário com `role: super_admin`. O passo a passo, o modelo de trial e o que ainda não tem provedor de pagamento estão em [docs/saas.md](docs/saas.md).
