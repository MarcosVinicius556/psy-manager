## O que mudou

<!-- Resumo em português. Diga o porquê, não só a lista de arquivos. -->

## Como testar

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build` (com `.env.local` ou os placeholders do CI)

## Checklist

- [ ] A branch segue `feature/`, `fix/` ou `hotfix/` (hotfix só para correção urgente em produção)
- [ ] O PR entra em `develop`, ou em `master` apenas a partir de `develop` ou `hotfix/*`
- [ ] Não há segredo novo com prefixo `NEXT_PUBLIC_`
- [ ] `.env.example` foi atualizado se entrou ou saiu variável
