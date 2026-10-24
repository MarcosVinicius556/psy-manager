import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Política de privacidade | Psy Manager",
  description: "Como a Psy Manager separa dados cadastrais, comerciais e clínicos, e o que ainda precisa de validação jurídica.",
};

export default function PrivacyPage() {
  return (
    <article className="site-container py-24 sm:py-28">
      <div className="mx-auto max-w-3xl">
      <BrandLogo height={40} className="max-w-[70vw]" />
      <h1 className="mt-5 text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.15] text-teal">Política de privacidade</h1>
      <p className="mt-4 text-sm text-muted">Texto operacional de 20 de outubro de 2026. Não substitui uma política revisada por assessoria jurídica, nem o aceite destes termos substitui, sozinho, uma base legal da LGPD.</p>
      <div className="mt-8 space-y-6 leading-relaxed text-muted">
        <section>
          <h2 className="text-[clamp(1.5rem,1.2rem+1vw,1.875rem)] leading-tight text-teal">Quais dados entram no cadastro</h2>
          <p className="mt-2">No cadastro pedimos nome, e-mail e senha. A senha fica só como credencial do Firebase. O aceite dos termos também é registrado. O nome do consultório, se você quiser informar, entra depois, nas configurações do painel. O período de avaliação guarda datas de início e fim. Não pedimos cartão de crédito e a aplicação não armazena número completo de cartão.</p>
        </section>
        <section>
          <h2 className="text-[clamp(1.5rem,1.2rem+1vw,1.875rem)] leading-tight text-teal">Dados clínicos</h2>
          <p className="mt-2">Pacientes, evoluções, anexos e contratos ficam no ambiente da profissional, separados por conta. O painel do proprietário da plataforma mostra metadados de conta, plano e comunicação. Ele não abre prontuário.</p>
        </section>
        <section>
          <h2 className="text-[clamp(1.5rem,1.2rem+1vw,1.875rem)] leading-tight text-teal">Para que os dados são usados</h2>
          <p className="mt-2">Para criar o acesso, operar o consultório, avisar sobre o fim da avaliação e, quando houver provedor, cobrar um plano escolhido. Comunicados de produto respeitam a preferência de e-mail. Avisos operacionais da conta, como o término da avaliação, continuam previstos mesmo quando o e-mail de produto está desligado.</p>
        </section>
        <section>
          <h2 className="text-[clamp(1.5rem,1.2rem+1vw,1.875rem)] leading-tight text-teal">Compartilhamento e retenção</h2>
          <p className="mt-2">A autenticação usa Firebase. Arquivos enviados pelo painel usam o armazenamento já configurado no projeto, hoje Cloudinary. O e-mail transacional, quando as variáveis estão preenchidas, sai pelo remetente configurado. Não há descarte automático de prontuário ao fim do teste. Prazo de retenção, exportação do titular e resposta a incidentes ainda precisam ser definidos antes da comercialização.</p>
        </section>
        <section>
          <h2 className="text-[clamp(1.5rem,1.2rem+1vw,1.875rem)] leading-tight text-teal">O que confirmar antes de vender</h2>
          <p className="mt-2">Base legal para dados de saúde, papel de controladora e operadora, contrato com a clínica, canal do encarregado, política de retenção e o texto final desta página.</p>
        </section>
      </div>
      <p className="mt-10"><Link href="/termos" className="inline-flex min-h-11 items-center font-semibold text-teal">Ler os termos de uso</Link></p>
      </div>
    </article>
  );
}
