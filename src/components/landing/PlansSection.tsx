import Link from "next/link";
import ConsultantActions from "@/components/ConsultantActions";
import { CONSULTANT_WHATSAPP_LABEL, consultantEmail } from "@/lib/contact";
import { TRIAL_DAYS } from "@/lib/saas/model";

const trialResources = ["Agenda", "Pacientes", "Locais", "Financeiro", "Contratos", "Relatórios"];

export default function PlansSection() {
  const email = consultantEmail();

  return (
    <section id="planos" className="bg-paper py-16 sm:py-24">
      <div className="site-container">
        <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">Valores</p>
        <h2 className="mt-3 max-w-2xl text-[clamp(1.7rem,1.15rem+2.2vw,3rem)] leading-[1.18]">
          {TRIAL_DAYS} dias gratuitos. O plano contínuo se fecha com um consultor.
        </h2>
        <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
          A avaliação não pede cartão. Quando quiser seguir com o uso pago, conversamos no WhatsApp ou por e-mail — sem checkout automático nesta página.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="landing-card">
            <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Gratuito</p>
            <h3 className="mt-3 text-[1.7rem]">Avaliação</h3>
            <p className="mt-3 font-num text-2xl text-teal">R$ 0</p>
            <p className="text-sm text-muted">{TRIAL_DAYS} dias de teste · sem cartão</p>
            <p className="mt-4 leading-relaxed text-muted">
              Uso do painel no período de teste. Não há cobrança neste plano.
            </p>
            <ul className="mt-4 grid gap-1 text-sm text-ink">
              {trialResources.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/cadastro" className="btn-primary w-full sm:w-auto">
                Começar gratuitamente
              </Link>
              <Link href="/admin/login" className="btn-text w-full sm:w-auto">
                Entrar
              </Link>
            </div>
          </article>

          <article className="landing-card">
            <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Uso contínuo</p>
            <h3 className="mt-3 text-[1.7rem]">Fale com um consultor</h3>
            <p className="mt-3 font-num text-2xl text-teal">Sob consulta</p>
            <p className="text-sm text-muted">Condição alinhada direto com a Psy Manager</p>
            <p className="mt-4 leading-relaxed text-muted">
              O plano pago não é fechado nesta página. Um consultor combina o valor e a forma de uso do consultório — pelo WhatsApp {CONSULTANT_WHATSAPP_LABEL}
              {email ? ` ou por e-mail.` : "."}
            </p>
            <ul className="mt-4 grid gap-1 text-sm text-ink">
              <li>Mesmos módulos da avaliação</li>
              <li>Condição definida na conversa</li>
              <li>Sem cartão guardado no sistema</li>
            </ul>
            <div className="mt-8">
              <ConsultantActions email={email} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
