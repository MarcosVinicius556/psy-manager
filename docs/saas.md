# Psy Manager como SaaS

Este documento registra como o cadastro, o trial, os planos e a área do proprietário foram encaixados no produto que já existia.

## O que não mudou

O painel clínico continua em `/admin`. Agenda, pacientes, financeiro, contratos, relatórios, locais e convites seguem no mesmo lugar, com os mesmos documentos do Firestore. Contas que já existiam não recebem um trial de 30 dias.

## Onde ficou cada coisa

| Caminho | Quem usa |
| --- | --- |
| `/` | Página pública |
| `/cadastro` | Novo profissional |
| `/admin` | Painel clínico |
| `/admin/assinatura` | Plano, trial e contratação |
| `/plataforma` | Proprietário da Psy Manager |

`/admin` já era o produto do consultório. Mover isso quebraria os acessos atuais, então a gestão da plataforma ficou em `/plataforma`.

## Conta, trial e acesso

O cadastro público cria o usuário no Firebase Authentication, um documento em `users/{uid}`, o profissional em `members`, o diretório e um registro único em `trialClaims/{email}`. O trial dura 30 dias a partir desse momento. A senha não é gravada no Firestore: o Firebase guarda o hash.

O mesmo caminho vale para o Google (`signInWithPopup`). A conta nova entra no trial de 30 dias, com o papel `psicologo`, e não pede o nome do consultório. Quem já tem senha nesse e-mail continua entrando por e-mail: o Firebase não junta as duas formas sozinho. Para o botão funcionar, ative o provedor Google em Authentication e autorize o domínio do site.

Um segundo cadastro com o mesmo e-mail é barrado pelo Authentication. Se o e-mail já consumiu um trial e mesmo assim surgir outro usuário, a conta nova nasce com avaliação encerrada. E-mails diferentes ainda podem abrir trials diferentes; não há como impedir isso só com o cadastro, sem um documento ou um pagamento.

Conta e assinatura são campos separados:

- `accountStatus`: `ativa`, `suspensa`, `desativada`
- `subscriptionStatus`: `trial_ativo`, `trial_expirado`, `ativa`, `pagamento_pendente`, `pagamento_atrasado`, `cancelada`, `encerrada`, `cortesia`, `legado`
- `billingAccess`: `trial`, `integral`, `restrito`, `legado`

`ativa`, `pagamento_pendente` e `pagamento_atrasado` não são gravados pelo cadastro nem pelo painel do proprietário. Eles ficam reservados para um provedor de pagamento real. Cortesia é acesso concedido à mão e aparece como cortesia, não como pagamento.

Quem já tinha documento de usuário, e quem é cadastrado em `/admin/usuarios`, recebe `legado` e continua lançando. O proprietário (`super_admin`) não entra nesse fluxo.

## O que trava quando o trial acaba

A interface esconde a ação, e as regras do Firestore recusam criação, edição e exclusão dos dados do consultório quando o prazo passou, a conta está suspensa ou desativada, ou o acesso está `restrito`. A leitura permanece. Nada é apagado.

Não há cron. O prazo vale na regra pelo timestamp, e o status é atualizado quando a pessoa entra. Enquanto as regras novas não forem publicadas, o bloqueio existe na interface, mas um cliente alterado ainda conseguiria gravar. Por isso a publicação das regras faz parte da implantação.

## Pagamento

Não há gateway. “Quero contratar” grava `checkoutStatus: aguardando_provedor` e um evento em `users/{uid}/billingEvents`. A assinatura não vira paga. O preço do plano começa vazio e só passa a aparecer se o proprietário publicar um valor em `/plataforma/planos`. Receita recorrente no painel soma apenas assinaturas `ativa` com preço definido. Pagamento recebido fica em zero enquanto não existir confirmação de provedor.

Cartão não é armazenado.

## Plataforma

`/plataforma` exige `users/{uid}.role == super_admin`, conferido no cliente e nas regras. O cadastro público só grava `psicologo`. A área lista contas, planos, avisos e auditoria. Não há consulta a pacientes, evoluções ou anexos.

Auditoria fica em `platformAudit` e não aceita edição nem exclusão pela aplicação. Ações de plano, trial, suspensão, cortesia e comunicado entram nesse registro.

## E-mail

Avisos internos nascem em `users/{uid}/inbox` mesmo sem SMTP. O e-mail sai só se `EMAIL_TO` e `GMAIL_APP_PASSWORD` estiverem preenchidos, e a tela só marca “enviado” quando o provedor aceita. Boas-vindas e avisos de trial (7, 3 e 1 dia, depois o encerramento) usam o aviso mais próximo que ainda não foi criado, para não disparar a série inteira de uma vez.

Comunicado de produto respeita `productEmail`. Aviso operacional da conta continua previsto.

## Como preparar o proprietário

1. Crie o usuário no Firebase Authentication.
2. No Firestore, grave `users/{uid}` com `role: super_admin` antes do primeiro acesso à plataforma.
3. Publique as regras: `firebase deploy --only firestore:rules,storage`, com a CLI apontando para este projeto. O Firestore usa `firestore.rules` e o Storage usa `storage.rules` (os dois estão no `firebase.json`).
4. Preencha `.env.local` a partir de `.env.example`.
5. Entre em `/plataforma/login`.

Sem o documento `super_admin` criado no console, o cadastro público não tem como produzir um administrador.

## O que ainda depende de decisão externa

- Provedor de pagamento, webhook assinado, idempotência e o estado `ativa`.
- Revisão jurídica de termos, política, base legal de dados de saúde, retenção e canal do titular. O aceite atual não substitui isso.
- Autenticação em duas etapas do proprietário: o Firebase permite MFA no projeto, e isso vale para o Authentication inteiro. Não foi ligado no código para não alterar o login de todos os profissionais sem essa decisão.
- App Check, se o cadastro público passar a receber abuso além do limite que o próprio Firebase já aplica.
- Job agendado, se quiser avisos de trial sem esperar a pessoa entrar. A regra de acesso já não depende desse job.

## Testes

`npm test` cobre cadastro, janela de 30 dias, expiração, conta antiga, suspensão, checkout sem pagamento, ações administrativas e o cálculo de receita. Isolamento clínico e a trava de escrita dependem das regras do Firestore, que precisam ser publicadas no projeto.
