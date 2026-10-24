import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Termos de uso | Psy Manager",
  description: "Condições de uso da Psy Manager, incluindo avaliação gratuita, assinatura e preservação dos dados do consultório.",
};

export default function TermsPage() {
  return (
    <article className="container max-w-3xl py-28">
      <BrandLogo height={48} />
      <h1 className="mt-5 text-5xl text-teal">Termos de uso</h1>
      <p className="mt-4 text-sm text-muted">Versão de 20 de outubro de 2026. Este texto organiza o uso do produto. Antes do lançamento comercial, ele precisa de revisão jurídica.</p>
      <div className="mt-8 space-y-6 leading-relaxed text-muted">
        <section>
          <h2 className="text-3xl text-teal">O que a plataforma é</h2>
          <p className="mt-2">A Psy Manager é o painel operacional do consultório: agenda, pacientes, financeiro, contratos e relatórios. A conta é da profissional ou da clínica que se cadastra. Os dados clínicos pertencem a esse ambiente e não ficam disponíveis no painel do proprietário da plataforma.</p>
        </section>
        <section>
          <h2 className="text-3xl text-teal">Avaliação de 30 dias</h2>
          <p className="mt-2">O cadastro público abre um período de avaliação de 30 dias, contado do momento em que a conta é criada. Não há cobrança automática nesse período. Cada e-mail tem direito a uma avaliação. Ao terminar sem contratação, novos lançamentos são interrompidos e os dados já gravados permanecem.</p>
        </section>
        <section>
          <h2 className="text-3xl text-teal">Planos e pagamento</h2>
          <p className="mt-2">Os preços, quando existirem, aparecem na página de planos. Enquanto nenhum provedor de pagamento estiver configurado, uma solicitação de contratação não ativa uma assinatura paga e não representa pagamento recebido. Contas criadas antes deste fluxo, ou cadastradas pelo proprietário, não são colocadas em avaliação.</p>
        </section>
        <section>
          <h2 className="text-3xl text-teal">Cancelamento, suspensão e exclusão</h2>
          <p className="mt-2">Cancelar a avaliação encerra os novos lançamentos. Suspender ou desativar uma conta é uma ação do proprietário da plataforma e também não apaga prontuários. A exclusão definitiva de dados clínicos não faz parte deste fluxo e depende de uma política de retenção e de um pedido do titular.</p>
        </section>
        <section>
          <h2 className="text-3xl text-teal">Responsabilidade profissional</h2>
          <p className="mt-2">O registro clínico continua sob a responsabilidade de quem atende. A plataforma não substitui o julgamento profissional nem o dever de sigilo.</p>
        </section>
      </div>
      <p className="mt-10"><Link href="/privacidade" className="font-semibold text-teal">Ler a política de privacidade</Link></p>
    </article>
  );
}
