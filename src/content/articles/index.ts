export type Article = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  sources: string[];
  body: string[];
};

export const ARTICLES: Article[] = [
  {
    slug: "receita-saude-psicologos",
    title: "Receita Saúde para psicólogos: o que lançar no app",
    description: "Como cruzar recibos do consultório com o app Receita Saúde sem enviar dados automaticamente.",
    publishedAt: "2026-10-01",
    updatedAt: "2026-10-20",
    sources: ["Receita Federal — app Receita Saúde", "Psy Manager — relatório mensal"],
    body: [
      "O Psy Manager gera recibo PDF e relatório mensal para você lançar manualmente no app Receita Saúde ou no Carnê-Leão Web.",
      "Separe pagamentos quitados por mês, confira CPF do paciente e valor por sessão antes de declarar.",
      "Guarde o PDF emitido no sistema como comprovante interno; a declaração oficial continua sendo sua responsabilidade.",
    ],
  },
  {
    slug: "tcle-lgpd-psicologia",
    title: "TCLE e LGPD no consultório de psicologia",
    description: "Finalidade, base legal e registro de aceite alinhados à CFP 9/2024.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-20",
    sources: ["CFP Resolução nº 9/2024", "ANPD — guias de tratamento de dados"],
    body: [
      "O termo de consentimento deve explicar finalidade, tempo de guarda e direitos do titular.",
      "No Psy Manager você emite TCLE com modelo editável e registra aceite em papel ou digital.",
      "Dados sensíveis exigem cuidado redobrado: limite o acesso e documente quem pode ver cada registro.",
    ],
  },
  {
    slug: "guarda-prontuario-cinco-anos",
    title: "Guarda mínima de prontuário: 5 anos",
    description: "O que a Resolução CFP 001/2009 exige e como organizar arquivos no dia a dia.",
    publishedAt: "2026-10-03",
    updatedAt: "2026-10-20",
    sources: ["CFP Resolução nº 001/2009"],
    body: [
      "Mantenha evoluções por sessão e documentos vinculados ao paciente pelo prazo mínimo legal.",
      "Exportações periódicas ajudam na portabilidade LGPD sem substituir a guarda clínica.",
      "Ao encerrar atendimento, registre data e motivo; não apague registros antes do prazo.",
    ],
  },
  {
    slug: "politica-faltas-sessao",
    title: "Política de faltas: clareza no contrato",
    description: "Como comunicar cobrança por falta sem surpresa para o paciente.",
    publishedAt: "2026-10-04",
    updatedAt: "2026-10-20",
    sources: ["Código de Ética Profissional do Psicólogo"],
    body: [
      "Descreva prazo de aviso, percentual da sessão e exceções no contrato de prestação de serviços.",
      "Registre faltas na agenda e vincule cobranças ao financeiro para manter histórico.",
      "Evite linguagem punitiva; foque em organização mútua da agenda.",
    ],
  },
  {
    slug: "cfp-9-2024-teleatendimento",
    title: "CFP 9/2024 e teleatendimento",
    description: "Requisitos para atendimento por tecnologias da informação e comunicação.",
    publishedAt: "2026-10-05",
    updatedAt: "2026-10-20",
    sources: ["CFP Resolução nº 9/2024"],
    body: [
      "Informe limites do atendimento remoto e canais de emergência no TCLE.",
      "Use links de videoconferência confiáveis e registre modalidade na agenda.",
      "Mantenha sigilo: evite gravar sessões sem consentimento específico.",
    ],
  },
  {
    slug: "cancelamento-assinatura-software",
    title: "Cancelar software clínico sem dor de cabeça",
    description: "Por que exportar dados antes e depois de cancelar, e como o Psy Manager facilita.",
    publishedAt: "2026-10-06",
    updatedAt: "2026-10-20",
    sources: ["LGPD art. 18 — portabilidade"],
    body: [
      "Peça exportação completa em formato aberto (JSON/CSV) antes de encerrar contratos longos.",
      "No Psy Manager o cancelamento é self-service e a exportação fica na página Assinatura.",
      "Após o fim do período pago, a conta fica em modo leitura para consulta e download.",
    ],
  },
  {
    slug: "pix-consultorio-sem-gateway",
    title: "Pix no consultório sem gateway",
    description: "QR estático e confirmação manual enquanto não há taxa de intermediário.",
    publishedAt: "2026-10-07",
    updatedAt: "2026-10-20",
    sources: ["Banco Central — padrão BR Code"],
    body: [
      "Chave Pix no recibo e na cobrança reduz atrito; a confirmação de pagamento pode ser manual.",
      "Registre comprovantes anexados pelo paciente para auditoria interna.",
      "Assinatura do software por Pix com confirmação humana evita custos de gateway na fase inicial.",
    ],
  },
  {
    slug: "mfa-consultorio-compartilhado",
    title: "MFA e computador compartilhado",
    description: "Verificação em duas etapas e logout por inatividade no consultório.",
    publishedAt: "2026-10-08",
    updatedAt: "2026-10-20",
    sources: ["Psy Manager — docs/mfa.md"],
    body: [
      "Ative TOTP em Configurações → Segurança em qualquer conta que acessa dados de pacientes.",
      "Logout automático após 30 minutos reduz risco em máquinas da recepção.",
      "Não salve senhas no navegador de uso coletivo.",
    ],
  },
  {
    slug: "indicadores-pratica-clinica",
    title: "Indicadores da prática: faltas, ticket e retenção",
    description: "Números agregados para decidir preço e política de agenda.",
    publishedAt: "2026-10-09",
    updatedAt: "2026-10-20",
    sources: ["Psy Manager — painel Início"],
    body: [
      "Taxa de faltas e ticket médio ajudam a calibrar política de remarcação.",
      "Retenção em 90 dias mostra quantos pacientes voltam após a primeira sessão.",
      "Nota média das avaliações públicas complementa a leitura qualitativa.",
    ],
  },
  {
    slug: "onboarding-paciente-rapido",
    title: "Cadastro rápido de paciente: só o nome",
    description: "Reduzir fricção no primeiro dia sem perder qualidade do prontuário depois.",
    publishedAt: "2026-10-10",
    updatedAt: "2026-10-20",
    sources: ["Psy Manager — checklist de onboarding"],
    body: [
      "Comece com nome e complete CPF, contato e documentos quando o vínculo estiver estabelecido.",
      "Use dados de exemplo para treinar a equipe sem expor informações reais.",
      "O checklist guia até o primeiro recibo emitido — momento em que o sistema prova valor.",
    ],
  },
];

export function articleBySlug(slug: string) {
  return ARTICLES.find((item) => item.slug === slug) ?? null;
}
