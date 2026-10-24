# Verificação em duas etapas (MFA)

O Psy Manager usa o **Firebase Authentication** com fatores TOTP (aplicativo autenticador). SMS só entra no fluxo de login quando o usuário não tem TOTP cadastrado e possui fator por telefone.

## Habilitar no projeto `clinic-manager-ed887`

Somente o **proprietário do projeto Firebase** pode ativar MFA. Passos resumidos:

1. Abra o [Console Firebase](https://console.firebase.google.com/) e selecione o projeto **clinic-manager-ed887**.
2. Em **Authentication** → **Sign-in method**, confirme que **E-mail/senha** está habilitado.
3. Ative o **Google Identity Platform** (upgrade do Firebase Auth) se ainda não estiver ativo — MFA avançado exige Identity Platform.
4. Em **Authentication** → **Settings** (ou **Multifactor**), habilite **Multi-factor authentication**.
5. Marque **TOTP** como fator permitido. SMS é opcional e só necessário como reserva.
6. Salve e aguarde alguns minutos para propagar.

Sem essa configuração, a interface mostra uma mensagem amigável (`auth/operation-not-allowed`) e a ativação em **Configurações → Segurança** não conclui.

## Comportamento no app

- Profissionais podem ativar/desativar MFA em `/admin/configuracoes` (seção **Segurança**).
- O login com e-mail trata o desafio `MultiFactorResolver` após a senha.
- Contas `super_admin` em `/plataforma` veem um aviso recomendando MFA até ativar.
- Sessões expiram após 30 minutos de inatividade (aviso de 60 segundos), exceto em `/feedback/*`.

## Recuperação

Usuários devem manter o aplicativo autenticador em dispositivo seguro. Perda do fator exige recuperação de senha pelo e-mail cadastrado e, se necessário, intervenção do suporte conforme política LGPD da clínica.
