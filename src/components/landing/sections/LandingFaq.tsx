import Link from "next/link";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { faqItems } from "@/components/landing/landing-content";

export default function LandingFaq() {
  return (
    <>
      <section id="faq" className="bg-landing-cream py-16 sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Dúvidas</SectionLabel>
            <h2 className="landing-display mt-4 text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
              O que já dá para saber antes de entrar
            </h2>
            <div className="mt-8 grid gap-3">
              {faqItems.map(([question, answer]) => (
                <details key={question} className="landing-card-v2 rounded-[18px] border border-[#e8e4dc] bg-white p-5">
                  <summary className="cursor-pointer text-lg font-semibold text-teal">{question}</summary>
                  <p className="mt-3 leading-relaxed text-muted">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="privacidade" className="bg-white py-16 sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Privacidade</SectionLabel>
            <h2 className="landing-display mt-4 text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
              Dados do consultório ficam no consultório
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              O cadastro pede nome, e-mail e senha. Dados de pacientes e registros clínicos ficam na conta de quem atende; a plataforma não abre o prontuário para operação ou suporte. A comunicação com o sistema usa criptografia em trânsito (HTTPS). Os registros do atendimento são guardados conforme a Resolução CFP nº 001/2009 (prazo mínimo de cinco anos). Atendimentos por tecnologias da informação seguem a Resolução CFP nº 9/2024. O texto completo está nos termos e na política de privacidade.
            </p>
            <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href="/termos" className="inline-flex min-h-11 items-center font-semibold text-teal">
                Termos de uso
              </Link>
              <Link href="/privacidade" className="inline-flex min-h-11 items-center font-semibold text-teal">
                Política de privacidade
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
