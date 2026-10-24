# Auditoria mobile UX — Psy Manager (v2)

Data: outubro/2026. Base: PR #2 (padding, tipografia, menu, drawer, bottom nav) + revisão heurística para experiência **app-like** em ~360–412px.

## Referências consultadas

| Fonte | Uso na decisão |
| --- | --- |
| [Material Design 3 — Applying layout](https://m3.material.io/foundations/layout/applying-layout/window-size-classes) | Hierarquia por “window size class”; barras inferiores e FAB em compact. |
| [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | Áreas seguras, navegação inferior, alvos confortáveis (~44pt). |
| [NN/g — Mobile UX](https://www.nngroup.com/articles/mobile-ux/) | Uma tarefa principal por tela; reduzir carga cognitiva entre sessões. |
| [Baymard — Mobile form UX](https://baymard.com/blog/mobile-form-usability) | Teclado correto, labels visíveis, evitar selects nativos estreitos. |
| [WCAG 2.2 SC 2.5.8 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Mínimo 24×24px (AA); alvo prático **44–48px** para toque frequente (alinha HIG/Material). |
| Padrões: Doctoralia, Psicomanager, Calendly, Google Calendar mobile | Barra inferior, agenda com faixa de dias, cartões de lista, ação primária fixa no polegar. |

## Princípios adotados (v2)

1. **Uma ação primária por tela** — FAB ou barra fixa inferior; secundárias no menu ⋮ ou header.
2. **Zona do polegar** — Tab bar com safe-area; FAB `bottom` acima da tab bar; filtros/busca sticky no topo do conteúdo.
3. **Hierarquia compacta** — Header app (título + ações), sem duplicar logo grande no mobile autenticado.
4. **Listas = cartões** no mobile; tabelas só em `md+`.
5. **Agenda = dia primeiro** — Faixa horizontal de dias + grade horária; mês em segundo plano.
6. **Formulários em sheet fullscreen** — Barra de salvar sticky; inputs `min-h-12` e `font-size: 16px` (evita zoom iOS).
7. **Estados** — Skeleton, empty ilustrado, toasts (já em uso).
8. **Motion** — Transições curtas; `prefers-reduced-motion` respeitado (já em `globals.css`).
9. **Marca** — Cores Cormorant/Inter, teal/accent/cream; logo lockup só no drawer, não ampliado.

---

## Heurísticas por área

Legenda de severidade: **S0** bloqueador · **S1** alto · **S2** médio · **S3** baixo.

### Landing (`/`, auth público)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| L1 | S1 | Hero longo + mock desktop empurra CTA abaixo da dobra | CTA sticky inferior no mobile; mock reduzido; social proof em carrossel horizontal |
| L2 | S2 | Blocos de produto muito textuais no mobile | Parágrafos encurtados visualmente (espaçamento); features em scroll-snap horizontal |
| L3 | S3 | Header landing ok pós-PR#2 | Manter; reforçar contraste no scroll |

### Auth (`/admin/login`, `/cadastro`)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| A1 | S1 | Ordem dos campos já corrigida em PR#2 | Manter; card com padding consistente |
| A2 | S2 | Botão Google e primário competem | Um primário visual; Google secundário outline |
| A3 | S2 | Teclado cobre submit | Scroll padding inferior + botão full-width |

### Admin — shell (header, drawer, tab bar)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| S1 | S1 | Header mobile = logo + hamburger (pouco contexto) | **MobileHeader**: título da página + ação contextual; logo só no drawer |
| S2 | S1 | Tab bar sem estado ativo forte | Indicador + label; `aria-current` |
| S3 | S2 | Tab bar compete com teclado | Ocultar tab bar com foco em input (já existe); manter |
| S4 | S3 | Menu hamburger duplicado (header + tab “Menu”) | Tab “Menu” abre mesmo drawer; header sem hamburger duplicado — usar ícone único |

### Dashboard (`/admin`)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| D1 | S2 | Widgets densos | Cards empilhados; skeleton no loading |
| D2 | S2 | Customização (`dashboardCustomization`) | Sem mudança de lógica; layout mobile nos widgets existentes |

### Agenda (`/admin/agenda`)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| G1 | S1 | Calendário mensal acima da grade no mobile | Em `hoje`: **DayStrip** + timeline primeiro; calendário abaixo ou colapsável |
| G2 | S1 | “Novo atendimento” no topo | **FAB** fixo acima da tab bar |
| G3 | S2 | Tabela semana/mês horizontal | Lista em cartões no mobile |
| G4 | S3 | Integração Google Calendar (outra branch) | Apenas apresentação; não tocar arquivos `google-calendar/` |

### Pacientes (lista + detalhe)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| P1 | S1 | Tabela 5 colunas com scroll horizontal | **ListCard** no mobile; busca/filtros sticky |
| P2 | S1 | Detalhe: muitas chips de aba | **SegmentedControl** scroll horizontal |
| P3 | S2 | Ações “Editar/Detalhes” pequenas | Cartão tocável + menu overflow |

### Financeiro (`/admin/financeiro`, despesas)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| F1 | S1 | KPIs + tabela larga | KPIs em cards 1 coluna; lançamentos em **StackedRow** |
| F2 | S2 | Filtros 4 colunas | Filtros empilhados sticky |

### Configurações

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| C1 | S2 | Muitos cards longos | Seções com títulos; salvar sticky por drawer |
| C2 | S3 | Grade de horários densa | Chips com alvo mínimo 44px |

### Plataforma (`/plataforma/*`)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| PL1 | S2 | Shell desktop-first | Padding e tabelas com mesmo padrão mobile admin (Shell existente) |

### Modais / formulários (Drawer)

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| M1 | S1 | Footer de salvar não sempre sticky | **StickyActionBar** no footer do Drawer |
| M2 | S2 | Select custom ok mas precisa altura | Manter Select; `min-h-12` |

### Acessibilidade transversal

| ID | Severidade | Problema | Decisão v2 |
| --- | --- | --- | --- |
| X1 | S1 | Alvos &lt; 44px em chips secundários | `min-h-11` em controles coarse (globals) |
| X2 | S2 | Contraste muted em fundo paper | Verificar ≥4.5:1 texto principal; accent só em botões |
| X3 | S2 | Foco visível | `:focus-visible` accent (já existe) |

---

## Componentes reutilizáveis (v2)

- `MobileHeader` — título + slot de ações
- `BottomSheet` — alias semântico do `Drawer` fullscreen mobile
- `ListCard` — linha/cartão de lista
- `StickyActionBar` — barra inferior de formulário
- `EmptyState` / `Skeleton` — estados de lista e loading
- `DayStrip` — faixa de dias na agenda
- `FloatingActionButton` — ação primária flutuante
- `SegmentedControl` — abas horizontais
- `StackedRow` — linha financeira empilhada

---

## Verificação

- Playwright: viewports 360×780, 390×844, 412×915 + 1440 desktop (`npm run e2e:mobile`)
- axe-core nos fluxos: landing, login, dashboard, agenda, pacientes, financeiro
- Sem scroll horizontal (`overflow-x: clip` + listas responsivas)
