import { landingScreenshots } from "@/lib/landing/screenshots";

export const faqItems = [
  ["Quanto tempo dura a avaliação?", "30 dias, contados da criação da conta. A data e a hora de término ficam no painel, em Assinatura."],
  ["Preciso de cartão para começar?", "Não. O cadastro não pede cartão e a aplicação não guarda número de cartão."],
  ["Qual é o preço depois do teste?", "O plano mensal e o anual estão publicados na landing e em /planos, com tudo incluso. A cobrança por Pix será habilitada em breve; até lá, um consultor pode ajudar na contratação."],
  ["Posso cancelar sozinho?", "Sim. Em Assinatura há cancelamento em poucos cliques, com e-mail de confirmação. Se houver período pago em aberto, o acesso integral segue até o fim do ciclo."],
  ["Como exporto meus dados?", "Na mesma página de Assinatura, use Exportar meus dados para baixar um ZIP com JSON, CSV e prontuários — portabilidade prevista na LGPD."],
  ["O que acontece quando os 30 dias acabam?", "Novos lançamentos param. Pacientes, agenda e financeiro já salvos permanecem para consulta e exportação."],
  ["Uma conta vê os pacientes de outra?", "Não. Cada profissional trabalha os dados do próprio consultório."],
  ["O proprietário da plataforma lê prontuários?", "Não. A área da plataforma acompanha conta, plano e comunicação, sem abrir a ficha clínica."],
  [
    "O Psy Manager envia dados à Receita Federal?",
    "Não. O sistema gera recibo PDF e relatório para você lançar manualmente no app Receita Saúde ou no Carnê-Leão Web.",
  ],
];

export const journeyStages = [
  {
    phase: "Antes",
    title: "Agenda e preparo",
    text: "Horários, locais, Google Agenda e lembretes quando você quiser enviar.",
    bullets: ["Visão semana e mês", "Meet na sessão online", "Paciente com contrato e TCLE"],
  },
  {
    phase: "Durante",
    title: "Registro clínico",
    text: "Prontuário por sessão, modelos por abordagem e nota restrita quando precisar.",
    bullets: ["Evolução estruturada", "Anexos na ficha", "Sigilo por profissional"],
  },
  {
    phase: "Depois",
    title: "Financeiro e conformidade",
    text: "Pagamentos, recibo PDF, Receita Saúde e indicadores da prática no Início.",
    bullets: ["Pacotes e despesas rateadas", "Exportação LGPD", "Cancelamento self-service"],
  },
];

export const exclusiveHighlights = [
  { title: "Receita Saúde no fluxo", text: "Relatório mensal alinhado ao caixa, com recibo numerado e campos para o app da Receita." },
  { title: "TCLE e contratos", text: "Modelos editáveis e registro de aceite, com trilha para LGPD e CFP 9/2024." },
  { title: "Despesas rateadas", text: "Consultórios compartilhados com convite entre colegas e divisão de custos fixos." },
  { title: "MFA e inatividade", text: "Verificação em duas etapas e logout automático após 30 minutos de inatividade." },
  { title: "DPA e suboperadores", text: "Lista pública de fornecedores e acordo de tratamento versionado, sem letras miúdas escondidas." },
  { title: "Backup diário", text: "Exportação criptografada com idade e hash publicados — recuperação documentada." },
];

export const dataPromisePoints = [
  "Não vendemos dados de pacientes nem usamos prontuário para treinar modelos de IA.",
  "Não abrimos ficha clínica no suporte da plataforma — só metadados de conta e cobrança.",
  "Não guardamos cartão: a assinatura paga será por Pix com confirmação explícita.",
  "Você pode exportar tudo em Assinatura e cancelar sem falar com ninguém.",
  "Suboperadores (Firebase, Vercel, e-mail etc.) estão listados com finalidade de tratamento.",
];

export const heroFloatingTags = [
  { label: "Recibo Receita Saúde", className: "left-[2%] top-[12%] md:left-[6%] md:top-[18%]" },
  { label: "LGPD", className: "right-[4%] top-[20%] md:right-[10%] md:top-[24%]" },
  { label: "Google Agenda", className: "left-[8%] bottom-[28%] md:left-[12%] md:bottom-[24%]" },
  { label: "TCLE", className: "right-[6%] bottom-[30%] md:right-[8%] md:bottom-[26%]" },
];

export const painPoints = [
  {
    pain: "Agenda em um app, financeiro em outro",
    solution: "Um painel para o dia",
    detail: "Semana, paciente, local e status na mesma grade — com lembrete quando você quiser.",
  },
  {
    pain: "Prontuário solto em arquivos",
    solution: "Ficha com linha do tempo",
    detail: "Evolução por sessão, TCLE e contrato ligados ao cadastro do paciente.",
  },
  {
    pain: "Recibo e declaração no fim do mês",
    solution: "Financeiro + Receita Saúde",
    detail: "Pagamento quitado gera recibo PDF; o relatório mensal cruza com o caixa do consultório.",
  },
];

export const featureShowcase = [
  {
    label: "Agenda",
    title: "A semana inteira, com local e modalidade",
    text: "Veja horários livres, sessões presenciais ou online e o consultório de cada atendimento — inclusive Meet na agenda quando aplicável.",
    bullets: ["Visão semana e mês", "Google Agenda opcional", "Sala compartilhada respeitada"],
    shot: landingScreenshots.agendaSemana,
    frame: "browser" as const,
  },
  {
    label: "Prontuário",
    title: "Prontuário e ficha do paciente no mesmo lugar",
    text: "Cadastro, TCLE, contrato e linha do tempo das sessões — estrutura voltada ao consultório de psicologia, com sigilo por profissional.",
    bullets: ["Evolução por sessão", "Anexos na ficha", "Acesso só da sua conta"],
    shot: landingScreenshots.pacienteProntuario,
    frame: "browser" as const,
  },
  {
    label: "Financeiro",
    title: "O mês em lançamentos reais",
    text: "Contas a receber, recebidos e em aberto no mesmo lugar em que você registra o atendimento.",
    bullets: ["Pacotes e avulsas", "Despesas da sala", "Recibo a partir do pagamento"],
    shot: landingScreenshots.financeiro,
    frame: "browser" as const,
  },
];

export const securityPoints = [
  {
    title: "Conta individual",
    text: "Cada psicólogo entra com login próprio. Não há compartilhamento de pacientes entre contas.",
  },
  {
    title: "Prontuário fora da plataforma",
    text: "A área administrativa da plataforma acompanha assinatura e suporte — sem abrir ficha clínica.",
  },
  {
    title: "HTTPS e consentimento",
    text: "Comunicação criptografada em trânsito. Cookies necessários ao login; opcionais só com seu consentimento.",
  },
  {
    title: "Resoluções do CFP",
    text: "Registros pensados para guarda mínima de cinco anos (CFP 001/2009) e teleatendimento (CFP 9/2024), conforme termos.",
  },
  {
    title: "LGPD na operação",
    text: "Dados de pacientes ficam na conta de quem atende; exportação e exclusão seguem política publicada.",
  },
  {
    title: "Depoimentos só com autorização",
    text: "A seção de depoimentos só aparece quando há autorização escrita de uso de nome e imagem — sem números inventados.",
  },
];

export const howItWorksSteps = [
  {
    n: "01",
    title: "Crie a sua conta",
    text: "Nome, e-mail e senha. Avaliação sem cartão; o consultório você organiza no seu ritmo.",
  },
  {
    n: "02",
    title: "Cadastre o essencial",
    text: "Locais, horários, pacientes e valores. O painel pede só o necessário para agenda e financeiro conversarem.",
  },
  {
    n: "03",
    title: "Acompanhe o mês",
    text: "Início mostra totais e agenda do dia. Contratos, relatórios e recibos ficam a um clique.",
  },
];
