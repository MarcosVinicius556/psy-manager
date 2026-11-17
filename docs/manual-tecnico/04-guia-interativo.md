# 4. Guia interativo (botão "?")

## Biblioteca: driver.js

Usamos [driver.js](https://driverjs.com) (v1, licença MIT). Motivos:

- **Sem dependência de React**: é JavaScript puro, então não tem conflito de peer dependency com React 19 / Next.js 15 (bibliotecas como `react-joyride` 2.x dependiam de APIs removidas no React 19, e Shepherd/Intro.js trazem mais peso ou licença comercial — Intro.js é AGPL/comercial).
- Pequena (~5 kB gzip), mantida ativamente, com destaque animado do elemento, popover com setas, progresso, teclado (← → Esc) e rolagem suave.
- Carregada sob demanda (`import("driver.js")` só no clique), sem custo no carregamento das páginas.

## Como funciona

- `src/components/help/HelpTourButton.tsx`: o botão **?**. Aparece em todas as páginas com guia:
  - celular: no cabeçalho (`MobileHeader`, usado pelo painel clínico e pela plataforma);
  - desktop (≥ 960px): botão fixo no canto inferior direito (`AdminShell` e `PlatformShell`);
  - portal do paciente: no cabeçalho do portal.
- `src/lib/help/tours.ts`: registro `TOURS` com um guia por rota (`match`), título e passos. A primeira entrada que casar com a rota vence, então rotas específicas vêm antes das gerais.
- Cada passo aponta para um elemento por seletor (`element`), de preferência `[data-tour="..."]`. Pode ser uma lista de alternativas (ex.: menu lateral no desktop **ou** barra inferior no celular); o primeiro elemento **visível** é usado. Se nenhum estiver visível, o passo é pulado. Passo sem `element` aparece centralizado.
- Âncoras comuns já presentes em todas as páginas: `nav` (menu lateral), `nav-mobile` (barra inferior), `page-title` / `page-title-mobile`, `page-actions` / `page-actions-mobile` (ações do `PageTitle`), `page-content` (área principal), `help-button`.
- Visual: classe `psy-tour-popover` em `globals.css` (superfície 8px, botões 6px, borda leve, hover transparente).

## Páginas cobertas

Painel clínico: Início, Agenda, Atendimento (incluindo falta e cobrança), Novo atendimento, Pacientes, Ficha do paciente, Novo paciente, Contas a receber, Receita Saúde, Contas a pagar, Locais, Pacotes, Equipe, Supervisão, Operacional (todos os modelos), Suporte, Assinatura, Notificações, Configurações (CRP, Pix, valores, regras de falta, horários), Agendamento público, Usuários, Sala.

Plataforma: Início, Contas, Detalhe da conta, Planos, Comunicados, Suporte, Auditoria.

Portal do paciente: Início, Sessões, Pagamentos, Tarefas, Diário, Mural, Documentos, Escalas, Conexões, Configurações.

O teste `src/lib/help/tours.test.ts` garante que as rotas principais têm guia.

## Cobrir uma página nova

1. Marque os elementos importantes com `data-tour="nome"`.
2. Adicione (ou ajuste) a entrada em `TOURS` com `match`, `title` e `steps` em pt-BR (diga o que o elemento faz e onde clicar).
3. Se a rota for específica (ex.: `/x/novo`), coloque-a antes da genérica (`/x`).
4. Inclua a rota em `MAIN_ROUTES` se for principal.
