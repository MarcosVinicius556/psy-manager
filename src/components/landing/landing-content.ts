import {
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
  HiOutlineShieldCheck,
  HiOutlineVideoCamera,
  HiOutlineChatAlt2,
  HiOutlineGlobeAlt,
} from "react-icons/hi";

export const faqItems = [
  ["Quanto tempo dura a avaliação?", "30 dias, contados da criação da conta. A data e a hora de término ficam no painel, em Assinatura."],
  ["Preciso de cartão para começar?", "Não. O cadastro não pede cartão e a aplicação não guarda número de cartão."],
  ["O que acontece quando os 30 dias acabam?", "Novos lançamentos param. Pacientes, agenda e financeiro já salvos permanecem, e a página de assinatura continua aberta."],
  ["Uma conta vê os pacientes de outra?", "Não. Cada profissional trabalha os dados do próprio consultório."],
  [
    "Como funciona o plano pago?",
    "Não há preço fixo nesta página. Você fala com um consultor no WhatsApp (49) 9 9826-6688 ou envia um e-mail. A avaliação de 30 dias continua gratuita e sem cartão.",
  ],
  ["O proprietário da plataforma lê prontuários?", "Não. A área da plataforma acompanha conta, plano e comunicação, sem abrir a ficha clínica."],
];

export const bentoFeatures = [
  {
    icon: HiOutlineShieldCheck,
    label: "Segurança",
    title: "Prontuário com LGPD em mente",
    text: "Acesso por conta, trilha de uso e dados clínicos separados da operação da plataforma. O registro segue o que o CFP exige para guarda e sigilo.",
    accent: "bg-[#e7f0e5] text-teal",
  },
  {
    icon: HiOutlineDocumentText,
    label: "Receita Saúde",
    title: "Recibos no formato certo",
    text: "Emissão de recibo para declaração no programa Receita Saúde, ligada ao atendimento e ao financeiro do consultório.",
    accent: "bg-[#f6e6df] text-accent",
  },
  {
    icon: HiOutlineClipboardCheck,
    label: "TCLE",
    title: "Consentimento organizado",
    text: "Modelos de TCLE e registro de aceite por paciente, sem perder o histórico quando o acompanhamento evolui.",
    accent: "bg-[#eef3ee] text-ink",
  },
  {
    icon: HiOutlineVideoCamera,
    label: "Teleconsulta",
    title: "Sessão online com Meet",
    text: "Link de videoconferência na agenda, integrado ao Google Agenda quando você conecta a conta.",
    accent: "bg-[#dfe8f0] text-[#2a4a5c]",
  },
  {
    icon: HiOutlineChatAlt2,
    label: "Feedback",
    title: "Avaliação por link",
    text: "Envie um link seguro para o paciente registrar como foi a sessão — sem expor a ficha clínica.",
    accent: "bg-[#f0ebe3] text-[#5c4a3d]",
  },
  {
    icon: HiOutlineOfficeBuilding,
    label: "Sala compartilhada",
    title: "Consultório dividido, conta individual",
    text: "Convites, despesas da sala e agenda por profissional. Cada um vê o próprio consultório, não o do colega.",
    accent: "bg-[#e7f0e5] text-teal",
  },
];

export const carouselCases = [
  {
    title: "Agenda do dia",
    text: "Horário, paciente, local e status na mesma grade — com lembrete quando você quiser.",
    progress: 0.72,
    tone: "from-[#3d5240] to-[#5a7a5e]",
  },
  {
    title: "Prontuário",
    text: "Evolução, anexos e histórico do acompanhamento em um só lugar, por profissional.",
    progress: 0.58,
    tone: "from-[#c47a5a] to-[#d9a088]",
  },
  {
    title: "Financeiro",
    text: "A receber, em atraso e recebido no mês — sem planilha paralela.",
    progress: 0.85,
    tone: "from-[#172f33] to-[#2d4a50]",
  },
  {
    title: "Google Agenda",
    text: "Sincronize compromissos do consultório com o calendário que você já usa.",
    progress: 0.64,
    tone: "from-[#4a6fa5] to-[#6b8fc4]",
  },
  {
    title: "Recibo Receita Saúde",
    text: "Gere o recibo a partir do atendimento registrado, pronto para o paciente declarar.",
    progress: 0.91,
    tone: "from-[#8b5e4a] to-[#c47a5a]",
  },
];

export const gridTiles = [
  { initials: "MA", hue: "#c47a5a" },
  { initials: "RS", hue: "#3d5240" },
  { initials: "CL", hue: "#8b9e8c" },
  { initials: "JP", hue: "#d4a574" },
  { initials: "LF", hue: "#5a7a5e" },
  { initials: "AN", hue: "#b8956a" },
  { initials: "TV", hue: "#6b8f71" },
  { initials: "DK", hue: "#a67c5b" },
  { initials: "EM", hue: "#4a6b4e" },
  { initials: "FG", hue: "#9c7b6a" },
  { initials: "HB", hue: "#7d9a80" },
  { initials: "IC", hue: "#c9a882" },
];

export const heroFloatingTags = [
  { label: "Recibo Receita Saúde", className: "left-[4%] top-[18%] md:left-[8%] md:top-[22%]" },
  { label: "LGPD", className: "right-[6%] top-[28%] md:right-[12%] md:top-[30%]" },
  { label: "Lembrete enviado", className: "left-[10%] bottom-[32%] md:left-[14%] md:bottom-[28%]" },
  { label: "TCLE assinado", className: "right-[8%] bottom-[36%] md:right-[10%] md:bottom-[32%]" },
];

export const workspaceTabs = {
  solo: {
    label: "Para você",
    cards: [
      { title: "Agenda", desc: "Dia e mês com paciente e local." },
      { title: "Prontuário", desc: "Evolução e anexos por sessão." },
      { title: "Financeiro", desc: "Caixa do consultório em um painel." },
      { title: "Recibos", desc: "Receita Saúde e comprovantes." },
      { title: "Contratos", desc: "Modelos e versões salvas." },
      { title: "Relatórios", desc: "PDF do que precisa registrar." },
    ],
  },
  clinic: {
    label: "Para clínicas",
    cards: [
      { title: "Sala compartilhada", desc: "Convites e despesas da sala." },
      { title: "Contas separadas", desc: "Cada profissional com login próprio." },
      { title: "Locais", desc: "Centro, online e outros endereços." },
      { title: "Pacotes", desc: "Sessões vendidas em bloco." },
      { title: "Meet", desc: "Teleconsulta na agenda." },
      { title: "Feedback", desc: "Link de avaliação pós-sessão." },
    ],
  },
} as const;

export const segmentIcons = [
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineCash,
  HiOutlineGlobeAlt,
];
