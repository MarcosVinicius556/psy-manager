"use client";

import Link from "next/link";

const TCLE_TEMPLATE = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
Tratamento de dados pessoais e atendimento psicológico

Eu, {{NOME_PACIENTE}}, {{QUALIFICACAO_PACIENTE}}, declaro que fui informado(a) pela psicóloga {{NOME_PSICOLOGO}}, CRP {{CRP}}, sobre:

1. Finalidade: registro e gestão do meu atendimento psicológico, inclusive armazenamento de prontuário na plataforma Psy Manager, operada por {{RAZAO_SOCIAL}} como operadora de dados sob instruções da profissional/clínica controladora.

2. Dados tratados: identificação, contato, histórico de sessões, evolução clínica, documentos anexos e, quando aplicável, dados sensíveis de saúde previstos no art. 11 da LGPD.

3. Forma de atendimento: {{MODALIDADE_ATENDIMENTO}} (presencial e/ou por tecnologias da informação e comunicação — TIC), nos termos da Resolução CFP nº 9/2024.

4. Compartilhamento: dados poderão ser tratados por suboperadores listados em https://www.psymanager.com.br/suboperadores, com possível transferência internacional e salvaguardas contratuais.

5. Direitos: posso solicitar informações, correções ou revogação do consentimento, quando cabível, diretamente à psicóloga responsável ou pelo canal {{CONTATO_CLINICA}}.

6. Sigilo: fui informado(a) sobre o dever de sigilo profissional e as exceções legais.

7. Tempo de guarda: registros serão mantidos pelo prazo mínimo de 5 (cinco) anos ou conforme orientação profissional e legal aplicável.

Declaro que tive oportunidade de tirar dúvidas e consinto com o tratamento descrito.

Local e data: {{LOCAL_DATA}}

Assinatura do paciente ou responsável legal: _______________________________
Nome do responsável legal (se menor): {{RESPONSAVEL_LEGAL}}

Assinatura da psicóloga: _______________________________`;

function downloadTemplate() {
  const blob = new Blob([TCLE_TEMPLATE], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tcle-psy-manager-modelo.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function PatientConsentTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-teal">Modelo de Termo de Consentimento (TCLE)</h1>
        <p className="mt-2 text-sm text-muted">
          Modelo para uso da psicóloga com pacientes sobre tratamento de dados e atendimento por TIC. Substitua os placeholders antes de imprimir ou assinar.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex min-h-11 items-center rounded-full bg-teal px-5 text-sm font-semibold text-white"
        >
          Baixar modelo (.txt)
        </button>
        <Link href="/privacidade" className="inline-flex min-h-11 items-center rounded-full border border-[#d7e0d8] px-5 text-sm font-semibold text-teal">
          Política de Privacidade
        </Link>
      </div>
      <pre className="overflow-x-auto rounded-2xl border border-[#d7e0d8] bg-white p-4 text-xs leading-relaxed text-muted whitespace-pre-wrap" data-allow-horizontal-scroll="true">
        {TCLE_TEMPLATE}
      </pre>
    </div>
  );
}
