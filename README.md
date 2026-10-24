# Psy Manager

Painel de gestão para consultórios de psicologia: agenda, pacientes, financeiro, contratos e relatórios. O acesso público cria uma conta com 30 dias de avaliação. A operação da plataforma fica em `/plataforma`.

## Começar

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha o Firebase. E-mail (`EMAIL_TO` e `GMAIL_APP_PASSWORD`) é opcional: sem ele, os avisos ficam só dentro do painel.

Abra [http://localhost:3000](http://localhost:3000).

## Antes de usar em produção

Publique `firestore.rules` e crie o documento do proprietário com `role: super_admin`. O passo a passo, o modelo de trial e o que ainda não tem provedor de pagamento estão em [docs/saas.md](docs/saas.md).

## Testes

```bash
npm test
```
