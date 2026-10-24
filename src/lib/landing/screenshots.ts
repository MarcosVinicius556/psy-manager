export type LandingShot = {
  src: string;
  avif?: string;
  alt: string;
  width: number;
  height: number;
};

const base = "/landing";

export const landingScreenshots = {
  adminInicio: {
    src: `${base}/admin-inicio.webp`,
    avif: `${base}/admin-inicio.avif`,
    alt: "Painel Início do Psy Manager com resumo do mês e agenda do dia",
    width: 1440,
    height: 900,
  },
  agendaSemana: {
    src: `${base}/agenda-semana.webp`,
    avif: `${base}/agenda-semana.avif`,
    alt: "Agenda semanal com horários, pacientes e locais",
    width: 1440,
    height: 900,
  },
  pacienteProntuario: {
    src: `${base}/paciente-prontuario.webp`,
    avif: `${base}/paciente-prontuario.avif`,
    alt: "Ficha do paciente com prontuário, TCLE e linha do tempo de sessões",
    width: 1440,
    height: 900,
  },
  financeiro: {
    src: `${base}/financeiro.webp`,
    avif: `${base}/financeiro.avif`,
    alt: "Financeiro do consultório com contas a receber e status de pagamento",
    width: 1440,
    height: 900,
  },
  receitaSaude: {
    src: `${base}/receita-saude.webp`,
    avif: `${base}/receita-saude.avif`,
    alt: "Relatório Receita Saúde com pagamentos recebidos no mês",
    width: 1440,
    height: 900,
  },
  reciboPdf: {
    src: `${base}/recibo-pdf.webp`,
    avif: `${base}/recibo-pdf.avif`,
    alt: "Recibo PDF de sessão de psicoterapia para declaração",
    width: 820,
    height: 1160,
  },
  avaliacaoPaciente: {
    src: `${base}/avaliacao-paciente.webp`,
    avif: `${base}/avaliacao-paciente.avif`,
    alt: "Página pública de avaliação da sessão por link seguro",
    width: 1440,
    height: 900,
  },
  avaliacaoPacienteMobile: {
    src: `${base}/avaliacao-paciente-mobile.webp`,
    avif: `${base}/avaliacao-paciente-mobile.avif`,
    alt: "Avaliação da sessão no celular do paciente",
    width: 412,
    height: 915,
  },
} satisfies Record<string, LandingShot>;

export const heroFanShots = [
  landingScreenshots.agendaSemana,
  landingScreenshots.pacienteProntuario,
  landingScreenshots.financeiro,
  landingScreenshots.reciboPdf,
];
