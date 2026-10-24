# Como contribuir

O Psy Manager usa duas branches de longa duração:

| Branch | Papel | Deploy na Vercel |
| --- | --- | --- |
| `develop` | Integração, teste e staging | Preview |
| `master` | Produção | Production, depois que o dashboard apontar a Production Branch para `master` |

Não se commita direto em `develop` nem em `master`. O trabalho entra por pull request.

## Nome das branches

Crie a branch a partir da base certa:

| Prefixo | Base | Destino do PR | Quando usar |
| --- | --- | --- | --- |
| `feature/nome-curto` | `develop` | `develop` | Funcionalidade nova |
| `fix/nome-curto` | `develop` | `develop` | Correção que pode esperar o ciclo normal |
| `hotfix/nome-curto` | `master` | `master` | Correção urgente do que já está em produção |

Use letras minúsculas e hífen. Exemplos: `feature/convite-local`, `fix/data-da-sessao`, `hotfix/login-google`.

Um hotfix também precisa voltar para `develop` depois do merge em `master` (um segundo PR, ou o merge de `master` em `develop`). Sem isso as duas branches divergem e o próximo release reintroduz o bug.

## Commits

Mensagem em português, no imperativo, dizendo o que mudou e por quê.

Prefixo sugerido, no estilo que o repositório já usa junto com uma frase curta:

- `feat:` funcionalidade
- `fix:` correção
- `docs:` documentação
- `ci:` GitHub Actions, Vercel, checagens
- `chore:` manutenção que não muda o produto
- `refactor:` mudança interna sem mudar comportamento
- `test:` teste

Exemplo: `fix: impede o segredo do Cloudinary de ir para o navegador`.

## Pull request

1. Abra o PR com o template do repositório.
2. O CI precisa passar. Os checks se chamam `CI / verify` e `CI / master-pr-source`.
3. Para `develop`, a origem é `feature/*` ou `fix/*`.
4. Para `master`, a origem só pode ser `develop` ou `hotfix/*`. O job `master-pr-source` recusa o resto. Esse job passa sem fazer nada quando a base não é `master`, para poder ser obrigatório também em `develop`.

## Release (`develop` → `master`)

1. Confira se `develop` está verde no CI e no preview da Vercel.
2. Abra um PR de `develop` para `master`. Não use squash se quiser que o histórico das duas branches continue fácil de comparar; merge commit deixa o próximo release mais simples.
3. Espere `CI / verify` e `CI / master-pr-source`.
4. Faça o merge. A Vercel publica a Production a partir de `master`.
5. `develop` continua sendo a branch de integração. O próximo `feature/*` sai dela, não de `master`.

## O que o CI faz

Em pull request e em push para `develop` e `master`:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`, com valores fictícios nas variáveis `NEXT_PUBLIC_*` e nas credenciais de servidor

O build de CI não usa segredo real. Firebase, Cloudinary e e-mail de verdade ficam só na Vercel e no `.env.local`.

## Pacotes

O gerenciador é o npm. Há um único lockfile, `package-lock.json`. Não adicione `yarn.lock` de volta.

Node.js 24 (as bibliotecas `@firebase/*` declaram `engines.node >= 24.12.0`). O CI usa o Node 24.
