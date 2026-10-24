// texto sujeito a revisão jurídica

import { replaceLegalPlaceholders } from "./config";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

function p(text: string) {
  return replaceLegalPlaceholders(text);
}

export const PRIVACIDADE_SECTIONS: LegalSection[] = [
  {
    id: "quem-somos",
    title: "Quem somos",
    paragraphs: [
      p("A {{RAZAO_SOCIAL}}, inscrita no CNPJ {{CNPJ}}, com sede em {{ENDERECO}}, opera a plataforma Psy Manager, software como serviço (SaaS) voltado a psicólogos e clínicas no Brasil."),
      p("Para dados de pacientes e do prontuário clínico, a psicóloga ou a clínica contratante atua como controladora nos termos da Lei nº 13.709/2018 (LGPD). A Psy Manager atua como operadora, tratando dados pessoais sensíveis de saúde (art. 11 da LGPD) somente conforme instruções documentadas da controladora e o Acordo de Tratamento de Dados (DPA)."),
      p("Para dados de conta, cobrança, suporte e uso da plataforma, a {{RAZAO_SOCIAL}} é controladora."),
    ],
  },
  {
    id: "dados-coletados",
    title: "Dados que coletamos",
    paragraphs: [
      "Cadastro e conta: nome, e-mail, senha (hash/credencial no Firebase), foto de perfil opcional, nome do consultório, preferências de notificação, registros de aceite legal e metadados de assinatura ou avaliação.",
      "Dados clínicos inseridos pela controladora: identificação de pacientes, contatos, histórico de atendimentos, evoluções, anexos, contratos terapêuticos, financeiro vinculado ao atendimento e demais campos preenchidos no painel.",
      "Dados técnicos: endereço IP, identificadores de sessão, logs de erro, agente de usuário (user agent) e registros de auditoria operacional necessários à segurança.",
      "Integrações opcionais: ao conectar Google Agenda, tratamos tokens OAuth e metadados de eventos conforme a configuração escolhida pela profissional.",
    ],
  },
  {
    id: "finalidades-bases",
    title: "Finalidades e bases legais",
    paragraphs: [
      "Execução de contrato e procedimentos preliminares (art. 7º, V): criar e administrar a conta, disponibilizar o painel, sincronizar agenda quando autorizado e prestar suporte.",
      "Legítimo interesse (art. 7º, IX), com avaliação de impacto quando aplicável: melhorar segurança, prevenir fraudes e medir desempenho técnico agregado, respeitando preferências de cookies.",
      "Cumprimento de obrigação legal ou regulatória (art. 7º, II): guarda de registros exigidos e resposta a autoridades, quando cabível.",
      "Dados sensíveis de saúde (art. 11): o tratamento clínico ocorre sob responsabilidade da controladora (psicóloga/clínica), com fundamento indicado no termo de consentimento com o paciente e no DPA. A operadora limita-se a hospedar e processar conforme instruções.",
      "Consentimento (art. 7º, I e art. 11): cookies não necessários e comunicações de marketing de produto, quando habilitadas.",
    ],
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento e suboperadores",
    paragraphs: [
      p("Utilizamos suboperadores listados em /suboperadores (Google Firebase, Vercel, Cloudinary, Google Calendar API quando conectada, provedor de e-mail SMTP/Gmail). Eles tratam dados apenas para as finalidades contratadas."),
      "Não vendemos dados pessoais. Compartilhamentos adicionais só ocorrem por ordem judicial, solicitação válida de autoridade ou com consentimento do titular, quando aplicável.",
    ],
  },
  {
    id: "transferencia",
    title: "Transferência internacional",
    paragraphs: [
      "Alguns suboperadores podem processar dados fora do Brasil (por exemplo, infraestrutura nos Estados Unidos). Quando isso ocorre, adotamos salvaguardas previstas na LGPD, incluindo cláusulas-padrão e mecanismos alinhados à Resolução CD/ANPD nº 19/2024 da ANPD para transferência internacional.",
      "A controladora deve avaliar o impacto para dados clínicos e informar pacientes quando necessário.",
    ],
  },
  {
    id: "retencao",
    title: "Retenção",
    paragraphs: [
      "Dados de conta: mantidos enquanto a relação contratual durar e pelo prazo necessário para obrigações legais, defesa de direitos e auditoria.",
      "Prontuário e registros clínicos: a controladora define o prazo no painel, observando o mínimo de 5 (cinco) anos para documentos psicológicos conforme Resolução CFP nº 001/2009, salvo prazo legal maior. A exclusão definitiva deve ser solicitada pela controladora após análise jurídica.",
      "Registros de aceite legal e logs de segurança: conservados pelo tempo necessário para comprovar consentimentos e investigar incidentes.",
    ],
  },
  {
    id: "seguranca",
    title: "Segurança",
    paragraphs: [
      "Aplicamos medidas técnicas e organizacionais descritas em /seguranca, incluindo controle de acesso, criptografia em trânsito (TLS), segregação por conta e monitoramento.",
      "Incidentes de segurança com risco ou dano relevante são tratados conforme Resolução CD/ANPD nº 15/2024, com comunicação à ANPD e aos titulares quando exigido.",
    ],
  },
  {
    id: "direitos",
    title: "Direitos do titular (art. 18)",
    paragraphs: [
      p("Titulares de dados de conta podem solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamentos e revogação de consentimento, quando aplicável, pelo e-mail {{ENCARREGADO_EMAIL}}."),
      "Para dados clínicos, pedidos devem ser direcionados prioritariamente à psicóloga ou clínica controladora, que coordena a resposta com a operadora.",
      "Responderemos em prazos razoáveis e conforme a LGPD, podendo solicitar comprovação de identidade.",
    ],
  },
  {
    id: "encarregado",
    title: "Encarregado (DPO)",
    paragraphs: [
      p("Encarregado pelo tratamento de dados da plataforma: {{ENCARREGADO_NOME}} — {{ENCARREGADO_EMAIL}}."),
    ],
  },
  {
    id: "cookies",
    title: "Cookies e tecnologias similares",
    paragraphs: [
      "Utilizamos cookies, localStorage e IndexedDB conforme detalhado em /cookies. O banner de consentimento permite aceitar, rejeitar não necessários ou configurar categorias.",
    ],
  },
  {
    id: "criancas",
    title: "Crianças e adolescentes",
    paragraphs: [
      "O cadastro na plataforma é destinado a profissionais maiores de 18 anos. Pacientes menores podem ter dados inseridos pela controladora; o consentimento deve ser obtido de pais ou responsáveis legais, nos termos do art. 14 da LGPD e da ética profissional.",
    ],
  },
  {
    id: "alteracoes",
    title: "Alterações desta política",
    paragraphs: [
      "Podemos atualizar este documento para refletir mudanças legais ou do produto. A versão vigente indica a data de vigência. Mudanças relevantes podem exigir novo aceite no login.",
    ],
  },
  {
    id: "foro",
    title: "Foro",
    paragraphs: [
      p("Fica eleito o foro da comarca da sede da {{RAZAO_SOCIAL}}, salvo disposição legal em contrário em favor do consumidor titular."),
    ],
  },
];

export const TERMOS_SECTIONS: LegalSection[] = [
  {
    id: "objeto",
    title: "Objeto e elegibilidade",
    paragraphs: [
      p("Estes Termos regulam o uso da Psy Manager, fornecida por {{RAZAO_SOCIAL}}. O usuário declara ser psicólogo regularmente inscrito no conselho regional ou representante autorizado da clínica."),
      "O uso implica capacidade civil e veracidade das informações cadastrais.",
    ],
  },
  {
    id: "papel-lgpd",
    title: "Papéis na LGPD",
    paragraphs: [
      "Para dados clínicos de pacientes, o usuário (clínica/profissional) é controlador e a Psy Manager é operadora.",
      "Para dados de conta, faturamento e operação do SaaS, a Psy Manager é controladora, conforme a Política de Privacidade.",
    ],
  },
  {
    id: "avaliacao",
    title: "Avaliação gratuita",
    paragraphs: [
      "Novos cadastros podem incluir período de avaliação de 30 dias, sem cobrança automática, conforme condições exibidas no momento do cadastro.",
      "Ao término, novos lançamentos podem ser limitados até contratação de plano, sem exclusão automática de dados já inseridos.",
    ],
  },
  {
    id: "obrigacoes",
    title: "Obrigações do profissional",
    paragraphs: [
      "Manter sigilo profissional, obedecer ao Código de Ética Profissional do Psicólogo, à Resolução CFP nº 001/2009 (registro documental) e à Resolução CFP nº 9/2024 (serviços por TIC).",
      "Obter consentimentos necessários dos pacientes, inclusive para teleatendimento e tratamento de dados sensíveis.",
      "Não inserir conteúdo ilícito, garantir backup local quando exigido pela prática clínica e notificar a operadora sobre incidentes de segurança relacionados à conta.",
    ],
  },
  {
    id: "propriedade",
    title: "Propriedade intelectual e licença",
    paragraphs: [
      "A plataforma, marcas e código permanecem da operadora. O usuário recebe licença limitada, não exclusiva e revogável para uso conforme o plano contratado.",
      "Conteúdos clínicos inseridos permanecem de titularidade da controladora.",
    ],
  },
  {
    id: "disponibilidade",
    title: "Disponibilidade e suporte",
    paragraphs: [
      "Buscamos alta disponibilidade, sem garantia de serviço ininterrupto. Manutenções podem ser programadas ou emergenciais.",
      "Suporte é prestado pelos canais indicados no painel ou por e-mail institucional.",
    ],
  },
  {
    id: "limitacao",
    title: "Limitação de responsabilidade",
    paragraphs: [
      "A plataforma é ferramenta de apoio administrativo e clínico; não substitui julgamento profissional. Na extensão permitida pela lei, a operadora não responde por danos indiretos decorrentes de uso inadequado ou de decisões clínicas do usuário.",
    ],
  },
  {
    id: "rescisao",
    title: "Suspensão e rescisão",
    paragraphs: [
      "Podemos suspender contas por inadimplência, violação destes Termos ou risco à segurança. O usuário pode encerrar o uso conforme fluxos do painel.",
      "A exclusão de dados clínicos segue a Política de Privacidade e o DPA.",
    ],
  },
  {
    id: "foro-termos",
    title: "Lei aplicável e foro",
    paragraphs: [
      "Aplica-se a legislação brasileira. Foro da sede da operadora, ressalvado o domicílio do consumidor quando aplicável.",
    ],
  },
];

export const COOKIES_SECTIONS: LegalSection[] = [
  {
    id: "intro",
    title: "Como usamos cookies",
    paragraphs: [
      "Cookies e tecnologias similares armazenam preferências e mantêm você conectado. Seguimos o guia de cookies da ANPD: consentimento prévio para não necessários, com opção de rejeitar e configurar categorias.",
    ],
  },
  {
    id: "categorias",
    title: "Categorias",
    paragraphs: [
      "Necessários: essenciais para login e segurança; não podem ser desativados.",
      "Funcionais: lembram preferências de interface (menu, layout do painel).",
      "Analíticos: medem uso agregado quando habilitados e consentidos.",
    ],
  },
  {
    id: "gerenciar",
    title: "Como gerenciar",
    paragraphs: [
      "Use o banner na primeira visita ou o link Preferências de cookies no rodapé. Você pode alterar a escolha a qualquer momento.",
    ],
  },
];

export const SEGURANCA_SECTIONS: LegalSection[] = [
  {
    id: "medidas",
    title: "Medidas técnicas e organizacionais",
    paragraphs: [
      "Autenticação com Firebase Auth, regras de segurança no Firestore por conta (ownerUid), TLS em todas as comunicações e segregação lógica multi-tenant.",
      "Controle de acesso baseado em papéis (profissional, administrador da plataforma), princípio do menor privilégio e registro de eventos relevantes.",
      "Backups e redundância conforme provedores de infraestrutura (Vercel, Google Cloud). Tokens de integração (Google Calendar) armazenados com criptografia no servidor.",
      "Testes de segurança, revisão de dependências e resposta a incidentes alinhada à Resolução CD/ANPD nº 15/2024.",
    ],
  },
  {
    id: "usuarios",
    title: "Boas práticas do usuário",
    paragraphs: [
      "Use senhas fortes, não compartilhe credenciais, ative verificação em duas etapas quando disponível no provedor de identidade e encerre sessões em dispositivos compartilhados.",
    ],
  },
];

export const SUBOPERADORES_SECTIONS: LegalSection[] = [
  {
    id: "lista",
    title: "Suboperadores",
    paragraphs: [
      "Google Firebase (Authentication e Firestore) — autenticação e banco de dados; pode processar dados nos EUA.",
      "Vercel Inc. — hospedagem da aplicação e funções serverless; pode processar dados nos EUA.",
      "Cloudinary — armazenamento de arquivos enviados pelo painel; localização conforme configuração da conta.",
      "Google Calendar API — sincronização opcional de agenda por usuário; dados de eventos conforme títulos configurados para privacidade.",
      "Provedor de e-mail (Gmail/SMTP configurado) — envio transacional de mensagens operacionais.",
    ],
  },
  {
    id: "contratos",
    title: "Garantias contratuais",
    paragraphs: [
      "Mantemos acordos ou termos padrão que impõem confidencialidade, segurança e limitação de finalidade. Transferências internacionais utilizam cláusulas alinhadas à Resolução CD/ANPD nº 19/2024 quando aplicável.",
    ],
  },
];

export const DPA_SECTIONS: LegalSection[] = [
  {
    id: "partes",
    title: "Partes e objeto",
    paragraphs: [
      p("Controladora: psicóloga ou clínica usuária da Psy Manager. Operadora: {{RAZAO_SOCIAL}}, CNPJ {{CNPJ}}."),
      "Este Acordo de Tratamento de Dados (DPA) integra os Termos de Uso e rege o tratamento de dados pessoais, inclusive sensíveis de saúde, inseridos na plataforma pela controladora.",
    ],
  },
  {
    id: "instrucoes",
    title: "Instruções e finalidades",
    paragraphs: [
      "A operadora trata dados apenas conforme documentação registrada, configurações do painel e instruções lícitas da controladora, para hospedar prontuário, agenda, financeiro e documentos.",
    ],
  },
  {
    id: "suboperadores-dpa",
    title: "Suboperadores",
    paragraphs: [
      "A controladora autoriza o uso dos suboperadores em /suboperadores, podendo solicitar informações atualizadas. Novos suboperadores relevantes serão comunicados com antecedência razoável.",
    ],
  },
  {
    id: "direitos-titular",
    title: "Direitos dos titulares",
    paragraphs: [
      "A operadora auxilia a controladora a atender pedidos de titulares (art. 18 LGPD), em prazo compatível com o legal, mediante solicitação documentada.",
    ],
  },
  {
    id: "incidentes",
    title: "Incidentes de segurança",
    paragraphs: [
      "A operadora notificará a controladora sem demora injustificada após tomar conhecimento de incidente com dados pessoais tratados sob este DPA, com informações para cumprimento da Resolução CD/ANPD nº 15/2024.",
    ],
  },
  {
    id: "retencao-dpa",
    title: "Retorno e eliminação",
    paragraphs: [
      "Ao término do contrato, a operadora disponibilizará exportação razoável dos dados e eliminará cópias na operadora após prazo acordado, salvo obrigação legal de guarda.",
    ],
  },
  {
    id: "auditoria",
    title: "Auditoria",
    paragraphs: [
      "Mediante solicitação razoável e confidencialidade, a operadora fornecerá informações necessárias para demonstrar conformidade, sem comprometer segurança de outros clientes.",
    ],
  },
];
