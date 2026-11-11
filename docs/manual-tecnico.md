# Manual técnico do Psy Manager

Este é o ponto de entrada da documentação técnica. Cada parte fica num arquivo próprio em [`docs/manual-tecnico/`](manual-tecnico/):

| Parte | Conteúdo |
| --- | --- |
| [1. Arquitetura e ambientes](manual-tecnico/01-arquitetura.md) | Stack, pastas, ambientes (develop/produção), fluxo de branches, CI e deploy |
| [2. Dados e segurança](manual-tecnico/02-dados-e-regras.md) | Firebase compartilhado, coleções, regras do Firestore, índices, deploy de regras, variáveis de ambiente |
| [3. Funcionalidades e integrações](manual-tecnico/03-funcionalidades.md) | Crons, integrações, portal do paciente e códigos de vínculo, cobrança/Pix, regras de falta, CRP |
| [4. Guia interativo (?)](manual-tecnico/04-guia-interativo.md) | Biblioteca, como os tours funcionam e como cobrir uma página nova |
| [5. Rodar e testar](manual-tecnico/05-rodar-e-testar.md) | Ambiente local, emuladores, testes, smoke test no ambiente de teste |

Documentos de apoio que continuam valendo: [README](../README.md), [CONTRIBUTING](CONTRIBUTING.md), [jobs.md](jobs.md), [saas.md](saas.md), [backup.md](backup.md), [email.md](email.md), [google-calendar.md](google-calendar.md), [mfa.md](mfa.md), [pwa.md](pwa.md), [support-tickets.md](support-tickets.md), [security/cloudinary-assets.md](security/cloudinary-assets.md).

> Regra de ouro: nenhum valor de segredo (token, chave, senha, chave Pix, CPF) entra neste manual, no repositório ou em logs. Só os **nomes** das variáveis.
