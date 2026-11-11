/**
 * Guias interativos ("?") por página. Cada passo aponta para um elemento por
 * seletor CSS (de preferência `[data-tour="..."]`). Passos cujo elemento não
 * está visível na tela atual (ex.: menu lateral no celular) são pulados; passo
 * sem `element` aparece centralizado.
 *
 * Para cobrir uma página nova: adicione uma entrada em TOURS (a primeira que
 * casar com o caminho vence, então coloque rotas específicas antes das gerais)
 * e marque os elementos com `data-tour`.
 */
export type TourStep = {
  /** Seletor ou lista de seletores alternativos (o primeiro visível é usado). */
  element?: string | string[];
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
};

export type PageTour = {
  id: string;
  match: (pathname: string) => boolean;
  title: string;
  steps: TourStep[];
};

const NAV = ['[data-tour="nav"]', '[data-tour="nav-mobile"]'];
const TITLE = ['[data-tour="page-title"]', '[data-tour="page-title-mobile"]'];
const ACTIONS = ['[data-tour="page-actions"]', '[data-tour="page-actions-mobile"]'];
const CONTENT = '[data-tour="page-content"]';
const HELP = ['[data-tour="help-button"]'];

const exact = (path: string) => (pathname: string) => pathname === path || pathname === `${path}/`;
const prefix = (path: string) => (pathname: string) => pathname === path || pathname.startsWith(`${path}/`);
const pattern = (re: RegExp) => (pathname: string) => re.test(pathname);

function navStep(description: string): TourStep {
  return { element: NAV, title: "Menu", description };
}

function helpStep(): TourStep {
  return {
    element: HELP,
    title: "Ajuda sempre à mão",
    description: "Clique no ? em qualquer página para rever este guia. Cada página tem o seu.",
  };
}

const ADMIN_TOURS: PageTour[] = [
  {
    id: "admin-inicio",
    match: exact("/admin"),
    title: "Início",
    steps: [
      { title: "Bem-vinda(o) ao Psy Manager", description: "Este guia mostra onde fica cada coisa. Use as setas ou as teclas ← → para navegar e Esc para sair." },
      navStep("Pelo menu você chega à Agenda, Pacientes, Financeiro, Equipe, Operacional e Configurações. No celular, os atalhos ficam na barra de baixo."),
      { element: CONTENT, title: "Seu painel", description: "Os cartões mostram próximos atendimentos, recebimentos e alertas. Clique num cartão para ir direto ao assunto." },
      helpStep(),
    ],
  },
  {
    id: "admin-agenda",
    match: prefix("/admin/agenda"),
    title: "Agenda",
    steps: [
      { element: TITLE, title: "Agenda", description: "Veja seus atendimentos por dia, semana ou mês." },
      { element: ACTIONS, title: "Novo agendamento", description: "Crie um atendimento avulso ou recorrente. O horário respeita seus turnos de trabalho." },
      { element: CONTENT, title: "Atendimentos", description: "Clique em um atendimento para abrir a ficha: iniciar, finalizar, registrar falta ou cancelar." },
      helpStep(),
    ],
  },
  {
    id: "admin-atendimento",
    match: pattern(/^\/admin\/atendimentos\/(?!novo)[^/]+\/?$/),
    title: "Atendimento",
    steps: [
      { element: TITLE, title: "Atendimento", description: "Aqui ficam os dados da sessão e a ficha clínica." },
      { element: '[data-tour="atendimento-acoes"]', title: "Ações da sessão", description: "Inicie o atendimento, marque “Não compareceu”, cancele ou altere o horário." },
      { element: '[data-tour="falta-justificada"]', title: "Falta justificada?", description: "Ao registrar a falta, diga se foi justificada. Suas regras de cobrança usam essa informação." },
      { element: '[data-tour="falta-cobranca"]', title: "Cobrança por falta", description: "Mostra a regra aplicada e a cobrança criada. Você pode cobrar outro valor ou dispensar a cobrança." },
      { element: CONTENT, title: "Ficha do atendimento", description: "Depois de iniciar, registre humor, evolução e anotações." },
      helpStep(),
    ],
  },
  {
    id: "admin-atendimento-novo",
    match: prefix("/admin/atendimentos/novo"),
    title: "Novo atendimento",
    steps: [
      { element: CONTENT, title: "Novo atendimento", description: "Escolha paciente, data, horário, modalidade e valor. Marque recorrência para repetir semanalmente." },
      helpStep(),
    ],
  },
  {
    id: "admin-pacientes-novo",
    match: prefix("/admin/pacientes/novo"),
    title: "Novo paciente",
    steps: [
      { element: CONTENT, title: "Cadastro do paciente", description: "Só o nome é obrigatório. CPF e e-mail ajudam no recibo e no envio de lembretes." },
      helpStep(),
    ],
  },
  {
    id: "admin-paciente",
    match: pattern(/^\/admin\/pacientes\/[^/]+\/?$/),
    title: "Ficha do paciente",
    steps: [
      { element: TITLE, title: "Ficha do paciente", description: "Dados, histórico de sessões, financeiro, documentos e prontuário do paciente." },
      { element: ACTIONS, title: "Ações", description: "Agende, edite o cadastro ou envie contrato, termo e formulários." },
      { element: CONTENT, title: "Histórico", description: "Role para ver sessões, faltas (com justificativa), cobranças e anexos." },
      helpStep(),
    ],
  },
  {
    id: "admin-pacientes",
    match: exact("/admin/pacientes"),
    title: "Pacientes",
    steps: [
      { element: TITLE, title: "Pacientes", description: "Sua lista de pacientes ativos e inativos." },
      { element: ACTIONS, title: "Novo paciente e código de vínculo", description: "Cadastre um paciente ou gere o código para o paciente se conectar pelo portal." },
      { element: CONTENT, title: "Lista", description: "Busque pelo nome e clique para abrir a ficha completa." },
      helpStep(),
    ],
  },
  {
    id: "admin-financeiro-receita",
    match: prefix("/admin/financeiro/receita-saude"),
    title: "Receita Saúde",
    steps: [
      { element: CONTENT, title: "Relatório Receita Saúde", description: "Confira os recebimentos do mês, emita recibos e feche o mês para o Carnê-Leão." },
      helpStep(),
    ],
  },
  {
    id: "admin-financeiro",
    match: prefix("/admin/financeiro"),
    title: "Contas a receber",
    steps: [
      { element: TITLE, title: "Contas a receber", description: "Todas as cobranças de sessões, pacotes e faltas." },
      { element: ACTIONS, title: "Novo lançamento", description: "Registre uma cobrança manual ou uma renda externa." },
      { element: CONTENT, title: "Cobranças", description: "Cada linha mostra vencimento, situação e, nas faltas, a regra aplicada. Clique para receber ou ver o histórico." },
      helpStep(),
    ],
  },
  {
    id: "admin-despesas",
    match: prefix("/admin/despesas"),
    title: "Contas a pagar",
    steps: [
      { element: CONTENT, title: "Contas a pagar", description: "Cadastre despesas fixas, variáveis ou parceladas e marque quando pagar." },
      helpStep(),
    ],
  },
  {
    id: "admin-locais",
    match: prefix("/admin/locais"),
    title: "Locais",
    steps: [
      { element: TITLE, title: "Locais", description: "Consultórios e salas onde você atende, inclusive compartilhados." },
      { element: ACTIONS, title: "Novo local", description: "Cadastre um local ou convide colegas para dividir a sala." },
      { element: CONTENT, title: "Seus locais", description: "Abra um local para ver agenda, convites e despesas compartilhadas." },
      helpStep(),
    ],
  },
  {
    id: "admin-pacotes",
    match: prefix("/admin/pacotes"),
    title: "Pacotes",
    steps: [
      { element: TITLE, title: "Pacotes", description: "Pacotes de sessões com valor fechado (quinzenal, mensal ou personalizado)." },
      { element: CONTENT, title: "Lista de pacotes", description: "Crie, edite e acompanhe quantas sessões restam em cada pacote." },
      helpStep(),
    ],
  },
  {
    id: "admin-supervisao",
    match: prefix("/admin/equipe/supervisao"),
    title: "Supervisão",
    steps: [
      { element: CONTENT, title: "Supervisão", description: "Compartilhe casos anonimizados com quem supervisiona você, com prazo e registro de acesso." },
      helpStep(),
    ],
  },
  {
    id: "admin-equipe",
    match: prefix("/admin/equipe"),
    title: "Equipe",
    steps: [
      { element: CONTENT, title: "Equipe", description: "Convide secretárias ou monte a equipe da clínica e defina o que cada pessoa pode ver." },
      helpStep(),
    ],
  },
  {
    id: "admin-operacional",
    match: prefix("/admin/operacional"),
    title: "Operacional",
    steps: [
      { element: TITLE, title: "Operacional", description: "Modelos de contrato, e-mail, prontuário, termo de consentimento, formulários, conformidade e relatórios." },
      { element: ACTIONS, title: "Criar modelo", description: "Crie ou edite modelos usados no dia a dia." },
      { element: CONTENT, title: "Seus modelos", description: "Use as variáveis entre {{ }} para preencher dados do paciente e do profissional automaticamente." },
      helpStep(),
    ],
  },
  {
    id: "admin-suporte",
    match: prefix("/admin/suporte"),
    title: "Suporte",
    steps: [
      { element: CONTENT, title: "Suporte", description: "Abra um chamado e acompanhe as respostas da equipe Psy Manager." },
      helpStep(),
    ],
  },
  {
    id: "admin-assinatura",
    match: prefix("/admin/assinatura"),
    title: "Assinatura",
    steps: [
      { element: CONTENT, title: "Assinatura", description: "Veja seu plano, o período de teste e pague a mensalidade por Pix." },
      helpStep(),
    ],
  },
  {
    id: "admin-notificacoes",
    match: prefix("/admin/notificacoes"),
    title: "Notificações",
    steps: [
      { element: CONTENT, title: "Notificações", description: "Lembretes de cobrança, convites de locais e alertas de despesas. Responda direto por aqui." },
      helpStep(),
    ],
  },
  {
    id: "admin-agendamento-publico",
    match: prefix("/admin/configuracoes/agendamento-publico"),
    title: "Agendamento público",
    steps: [
      { element: CONTENT, title: "Agendamento público", description: "Ative o link para pacientes pedirem horário. Você aprova cada pedido." },
      helpStep(),
    ],
  },
  {
    id: "admin-configuracoes",
    match: prefix("/admin/configuracoes"),
    title: "Configurações",
    steps: [
      { element: TITLE, title: "Configurações", description: "Seus dados, valores, regras de falta, horários, integrações e segurança." },
      { element: '[data-tour="crp"]', title: "CRP", description: "Escolha a região do seu Conselho (ex.: SC é CRP 12) e informe o número. Se a UF do endereço não bater, avisamos." },
      { element: '[data-tour="pix"]', title: "Pix", description: "Chave usada para gerar QR Code e Pix copia e cola nas cobranças." },
      { element: '[data-tour="valores"]', title: "Valores da consulta", description: "Valor base e social usados no agendamento e nas cobranças." },
      { element: '[data-tour="regras-falta"]', title: "Regras de falta", description: "Defina quanto cobrar em falta sem justificativa, falta justificada e a partir de quantas justificadas passa a cobrar." },
      { element: '[data-tour="horarios"]', title: "Horários de atendimento", description: "Seus turnos definem os horários livres na agenda e no agendamento público." },
      helpStep(),
    ],
  },
  {
    id: "admin-usuarios",
    match: prefix("/admin/usuarios"),
    title: "Usuários",
    steps: [
      { element: CONTENT, title: "Usuários", description: "Gestão de usuários do sistema (somente administradores)." },
      helpStep(),
    ],
  },
  {
    id: "admin-sala",
    match: prefix("/admin/sala"),
    title: "Sala",
    steps: [
      { element: CONTENT, title: "Sala compartilhada", description: "Agenda e despesas da sala que você divide com colegas." },
      helpStep(),
    ],
  },
];

const PLATFORM_TOURS: PageTour[] = [
  {
    id: "plataforma-inicio",
    match: exact("/plataforma"),
    title: "Plataforma",
    steps: [
      { title: "Painel da plataforma", description: "Área de administração do Psy Manager: contas, planos, comunicados, suporte e auditoria." },
      navStep("Use o menu para trocar de área. “Painel clínico” leva de volta ao consultório."),
      { element: CONTENT, title: "Indicadores", description: "Contas ativas, testes, assinaturas e uso recente." },
      helpStep(),
    ],
  },
  {
    id: "plataforma-conta",
    match: pattern(/^\/plataforma\/contas\/[^/]+\/?$/),
    title: "Conta",
    steps: [
      { element: TITLE, title: "Detalhe da conta", description: "Plano, situação, pagamentos e histórico de uma conta." },
      { element: CONTENT, title: "Ações", description: "Estenda o teste, troque o plano ou bloqueie/desbloqueie a conta. Tudo fica na auditoria." },
      helpStep(),
    ],
  },
  {
    id: "plataforma-contas",
    match: prefix("/plataforma/contas"),
    title: "Contas",
    steps: [
      { element: TITLE, title: "Contas", description: "Todas as contas de psicólogas(os)." },
      { element: CONTENT, title: "Lista", description: "Filtre por situação e clique numa conta para ver detalhes." },
      helpStep(),
    ],
  },
  {
    id: "plataforma-planos",
    match: prefix("/plataforma/planos"),
    title: "Planos",
    steps: [
      { element: CONTENT, title: "Planos", description: "Preços, limites e recursos de cada plano." },
      helpStep(),
    ],
  },
  {
    id: "plataforma-notificacoes",
    match: prefix("/plataforma/notificacoes"),
    title: "Comunicados",
    steps: [
      { element: CONTENT, title: "Comunicados", description: "Envie avisos para todas as contas ou para um grupo." },
      helpStep(),
    ],
  },
  {
    id: "plataforma-suporte",
    match: prefix("/plataforma/suporte"),
    title: "Suporte",
    steps: [
      { element: CONTENT, title: "Chamados", description: "Fila de chamados das contas. Abra um chamado para responder, mudar status ou atribuir." },
      helpStep(),
    ],
  },
  {
    id: "plataforma-auditoria",
    match: prefix("/plataforma/auditoria"),
    title: "Auditoria",
    steps: [
      { element: CONTENT, title: "Auditoria", description: "Registro de ações administrativas: quem fez, quando e em qual conta." },
      helpStep(),
    ],
  },
];

const PATIENT_TOURS: PageTour[] = [
  {
    id: "paciente-inicio",
    match: exact("/paciente"),
    title: "Portal do paciente",
    steps: [
      { title: "Seu portal", description: "Aqui você vê suas sessões, pagamentos, tarefas e documentos com a(o) sua(seu) psicóloga(o)." },
      { element: '[data-tour="patient-nav"]', title: "Navegação", description: "Use a barra de baixo para trocar de área." },
      { element: CONTENT, title: "Resumo", description: "Próxima sessão, pendências e avisos." },
      helpStep(),
    ],
  },
  ...(
    [
      ["sessoes", "Sessões", "Suas próximas sessões e o histórico. Confirme presença quando pedirem."],
      ["pagamentos", "Pagamentos", "Cobranças em aberto e pagas. Pague por Pix e envie o comprovante."],
      ["tarefas", "Tarefas", "Atividades combinadas na sessão. Marque como feita quando concluir."],
      ["diario", "Diário", "Anote como você está. Você decide o que compartilhar."],
      ["mural", "Mural", "Recados da(o) sua(seu) psicóloga(o)."],
      ["documentos", "Documentos", "Contratos, termos e recibos disponíveis para você."],
      ["escalas", "Escalas", "Questionários enviados para você responder."],
      ["conexoes", "Conexões", "Psicólogas(os) com quem você está conectado. Use um código de vínculo para conectar."],
      ["configuracoes", "Configurações", "Seus dados de acesso e preferências."],
    ] as const
  ).map(([slug, title, description]) => ({
    id: `paciente-${slug}`,
    match: prefix(`/paciente/${slug}`),
    title,
    steps: [{ element: CONTENT, title, description }, helpStep()],
  })),
];

export const TOURS: PageTour[] = [...ADMIN_TOURS, ...PLATFORM_TOURS, ...PATIENT_TOURS];

export function tourForPath(pathname: string): PageTour | null {
  return TOURS.find((tour) => tour.match(pathname)) ?? null;
}

/** Rotas principais que devem ter guia (usado nos testes). */
export const MAIN_ROUTES = [
  "/admin",
  "/admin/agenda",
  "/admin/pacientes",
  "/admin/pacientes/abc",
  "/admin/pacientes/novo",
  "/admin/atendimentos/abc",
  "/admin/atendimentos/novo",
  "/admin/financeiro",
  "/admin/financeiro/receita-saude",
  "/admin/despesas",
  "/admin/locais",
  "/admin/pacotes",
  "/admin/equipe",
  "/admin/equipe/supervisao",
  "/admin/operacional/contrato",
  "/admin/operacional/email",
  "/admin/operacional/prontuario",
  "/admin/operacional/consentimento",
  "/admin/operacional/formularios",
  "/admin/operacional/conformidade",
  "/admin/operacional/relatorios",
  "/admin/suporte",
  "/admin/assinatura",
  "/admin/notificacoes",
  "/admin/configuracoes",
  "/admin/configuracoes/agendamento-publico",
  "/plataforma",
  "/plataforma/contas",
  "/plataforma/contas/uid1",
  "/plataforma/planos",
  "/plataforma/notificacoes",
  "/plataforma/suporte",
  "/plataforma/auditoria",
  "/paciente",
  "/paciente/sessoes",
  "/paciente/pagamentos",
] as const;
