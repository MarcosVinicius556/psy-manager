import SectionLabel from "@/components/landing/ui/SectionLabel";
import DeviceFrame from "@/components/landing/ui/DeviceFrame";
import { landingScreenshots } from "@/lib/landing/screenshots";

export default function ReceitaSaudeSection() {
  return (
    <section className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        <div>
          <SectionLabel>Receita Saúde</SectionLabel>
          <h2 className="landing-display mt-4 text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
            Recibo PDF e relatório mensal no formato certo
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            O Psy Manager gera recibo a partir do pagamento quitado e monta o relatório Receita Saúde com os campos que você lança manualmente no app Receita Federal ou no Carnê-Leão Web — não há envio automático à Receita.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-ink">
            <li>Recibo PDF com CPF, CRP e dados do atendimento.</li>
            <li>Planilha e PDF do mês para cruzar com o financeiro.</li>
            <li>CPF de pagador e beneficiário na ficha do paciente.</li>
          </ul>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <DeviceFrame shot={landingScreenshots.reciboPdf} variant="browser" className="sm:col-span-2" />
          <DeviceFrame shot={landingScreenshots.receitaSaude} variant="browser" className="sm:col-span-2" />
        </div>
      </div>
    </section>
  );
}
