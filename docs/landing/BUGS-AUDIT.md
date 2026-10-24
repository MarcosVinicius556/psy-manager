# Landing audit — PR #29 (before fix)

Auditoria em **24/10/2026** com app em `develop` (commit `5fb4777`), viewports **1440×900**, **1024×768**, **768×1024** e **412×915**. Screenshots em `artifacts/landing-audit-before/`.

## Bugs e problemas de UX/conteúdo

### Hero e primeira dobra
- **Mockups falsos no fan-out**: cartões do hero são mini-UIs (`MiniMocks`) desenhadas no código, não capturas do admin — aparência de protótipo, não de produto.
- **Espaço morto no hero**: `HeroCardFan` reserva `40–50vh` vazios abaixo do fan-out, empurrando CTA e subtítulo para longe do título (scroll estranho na primeira tela).
- **Banner de cookies** sobrepõe hero e CTAs em vários viewports até aceitar — prejudica primeira impressão e screenshots.

### Seções irrelevantes ou enganosas (referência Gesso mal adaptada)
- **CommunitySection** (“Tem um lugar para você aqui”): fileiras de avatares coloridos sem relação com o produto; remete a marketplace/comunidade, não a SaaS clínico.
- **FeatureGridHoverSection**: grid com cursor-pill; 3 de 4 cards vazios com texto “Mockup do painel”; único card com `PatientsMock` em miniatura ilegível e cortada.
- **StatementSection**: parallax de mini-cards genéricos + copy genérica.
- **UseCaseCarouselSection**: cards com barras de progresso decorativas (sem dado real) — parecem métricas inventadas.
- **SegmentedWorkspaceSection**: toggle “Para você / Para clínicas” com lista textual, sem print real.
- **MediaTourSection**: `DashboardMock` estático com pills falsas (Agenda/Pacientes não clicáveis).

### Navegação e âncoras
- Link do header **Segurança** (`#seguranca`) apontava para seção **Módulos** (bento de features), não para LGPD/segurança — expectativa quebrada.
- **#funcionalidades** no segmented workspace, longe do hero; fluxo de conversão confuso.

### Layout e responsivo
- **412px**: avatares da community geram faixas horizontais largas; card central flutua sobre tiles vazios — poluição visual.
- **Hover-only** na grid de features inútil em touch (só “toque para destacar” sem conteúdo).
- Risco de **overflow horizontal** em animações com `x` em linhas de avatares (parallax).

### Cópia e produto
- Hero promete módulos corretos, mas corpo da página não mostra **prints reais** de Agenda semana, Prontuário, Financeiro, Receita Saúde, avaliação por link.
- Seção “Passe o mouse…” não comunica valor para psicólogos; tom de site criativo, não de ferramenta profissional.

### Acessibilidade / e2e (relacionado)
- Helper `loginAsDemo` exigia `.admin-tabbar` (só mobile `md:hidden`) — **login e2e falhava em viewport desktop** ao capturar telas.

### Performance (observado)
- Muitas seções com `motion` + imports dinâmicos + mocks pesados na dobra; LCP prejudicado por hero sem imagem real otimizada.

## O que foi mantido da referência (ref3)
- Fundo cream, tipografia display tight, pills flutuantes, fan-out com scroll suave, cards arredondados — aplicados **somente** com capturas reais e seções de produto.
