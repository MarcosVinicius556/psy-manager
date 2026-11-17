# 1. Arquitetura e ambientes

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack no dev), React 19, TypeScript 5 |
| Estilo | Tailwind CSS 4 + `src/styles/globals.css` (tokens de cor, raio e botões) |
| Animação | `motion` (Framer Motion) para transições de página e menu |
| Dados | Firebase: Authentication, Firestore (SDK web no cliente, `firebase-admin` nas rotas `/api`) |
| Arquivos | Cloudinary (entrega `authenticated` para anexos clínicos) |
| E-mail | Nodemailer (SMTP da plataforma e SMTP/Gmail OAuth por profissional) |
| Push | Web Push (VAPID) |
| PDF / QR | `jspdf`, `qrcode` (recibos, contratos, Pix copia e cola) |
| Guia interativo | `driver.js` (ver [parte 4](04-guia-interativo.md)) |
| Testes | Vitest (unidade e regras com emulador), Playwright (e2e/screenshots) |
| Hospedagem | Vercel (Functions Node.js + cron diário) |

## Pastas

```text
src/
  app/                 Rotas (App Router)
    admin/(panel)/     Painel clínico do(a) psicólogo(a) — /admin/*
    plataforma/(painel)/ Painel da plataforma (super_admin/suporte) — /plataforma/*
    paciente/          Portal do paciente — /paciente/*
    api/               Rotas de servidor (firebase-admin): cron, billing, patient-portal, tenant, support...
    (páginas públicas) landing, /cadastro, /agendar, /assinar, /formulario, /feedback, /confirmar, legais
  components/
    admin/             Componentes do painel (ui.tsx = Card, PageTitle, Field, Pill...)
    platform/          Shell e componentes da plataforma (reaproveita o shell do admin)
    patient/           Shell e componentes do portal do paciente
    help/              Botão "?" e guia interativo
    landing/, legal/, support/, auth/ ...
  lib/
    admin/             Domínio do consultório: tipos, coleções (Firestore), contexto (clinic-context), regras de falta, CRP...
    server/            Código só de servidor (cron, patient-portal, tenant-secretary, criptografia...)
    help/              Registro dos tours por rota
    billing/, pix/     Assinatura da plataforma e geração de BR Code
    saas/, team/       Conta/trial/planos e equipe (secretárias, clínica)
  styles/globals.css   Tokens e componentes CSS (btn-primary, btn-text, admin-card...)
firestore.rules        Regras do Firestore (compartilhadas por develop e produção)
firestore.indexes.json Índices compostos
scripts/               Migrações, backup, e2e, verificador de padrão visual
docs/                  Documentação
```

O estado do consultório no cliente fica em `src/lib/admin/clinic-context.tsx` (`useClinic()`): carrega pacientes, atendimentos, cobranças, membros etc. e expõe as ações (salvar, registrar falta, criar cobrança...). As leituras/escritas de Firestore ficam em `src/lib/admin/collections.ts`. Secretárias (acesso delegado) escrevem via `/api/tenant/*`, que usa `firebase-admin` e checa permissões no servidor (`src/lib/server/tenant-secretary.ts`).

## Ambientes

| Ambiente | Branch | URL | Observação |
| --- | --- | --- | --- |
| Teste / staging | `develop` | https://psy-manager-dev.vercel.app | Deploy de Preview da Vercel, protegido pela Deployment Protection |
| Produção | `master` | https://psy-manager-eta.vercel.app | Deploy de Production |
| Preview de PR | `feature/**`, `fix/**`, `hotfix/**` | URL gerada por deploy | Mesmo projeto Vercel |

**Os dois ambientes usam o mesmo projeto Firebase (`clinic-manager-ed887`).** Consequências:

- Uma mudança em `firestore.rules` publicada vale para teste **e** produção ao mesmo tempo. As regras precisam aceitar o cliente de `master` e o de `develop` enquanto as branches divergem (blocos marcados `// compat`).
- Dados criados no ambiente de teste aparecem para a mesma conta em produção.
- Ativar criptografia de campos clínicos (`CLINICAL_FIELD_ENC_KEY`) afeta os dois ambientes; é decisão do dono.

Para ver o ambiente de teste sem login na Vercel, use o header `x-vercel-protection-bypass` (automação) ou um link de compartilhamento gerado na Vercel.

## Branches, CI e deploy

```text
feature/* ou fix/*  →  PR  →  develop  →  PR  →  master
```

- `.github/workflows/ci.yml` roda em todo PR: **verify** (typecheck, lint, `verify:ui`, testes, regras no emulador, build), **backup-verify** (exporta/restaura no emulador) e **master-pr-source** (PR para `master` só pode vir de `develop` ou `hotfix/*`). O GitGuardian procura segredos.
- Merge em `develop` só com CI verde (squash). Merge em `master` só com pedido explícito do dono.
- O deploy da Vercel acontece no push da branch; o status aparece no commit como `Vercel – psy-manager`.
- `npm run verify:ui` (`scripts/verify-ui-standard.mjs`) barra padrões visuais proibidos (pílulas, raios fora do padrão).

## Padrão visual (obrigatório)

- Raio 6px em controles (`--radius-control`) e 8px em superfícies (`--radius-surface`); nada de pílula.
- Bordas leves (`#e7eee8`, `#d7e0d8`, `--color-border-subtle`); nada de borda escura/grossa.
- Hover de botão: fundo transparente com borda e texto na cor do preenchimento (já embutido em `.btn-*`).
- Listas com espaço entre itens; no celular, o mesmo padrão de linha/cartão; sem rolagem horizontal.
- Layout desktop a partir de 960px (`desk:`); a plataforma usa o mesmo shell do painel clínico.
