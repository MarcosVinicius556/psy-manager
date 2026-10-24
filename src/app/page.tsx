import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";
import { AgendaMock, DashboardMock, FinanceMock, PatientsMock } from "@/components/landing/Mockups";
import PlansSection from "@/components/landing/PlansSection";
import {
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
} from "react-icons/hi";

const features = [
  {
    icon: HiOutlineCalendar,
    title: "Agenda",
                text: "O dia e o mês do consultório, com paciente, profissional e local já vinculados. Horários livres, agendados e concluídos na mesma grade — sem mudar de ferramenta.",
  },
  {
    icon: HiOutlineUsers,
    title: "Pacientes",
    text: "Cadastro, ficha clínica, histórico e documentos do acompanhamento. Cada profissional trabalha a própria base — sem misturar com a página pública da clínica.",
  },
  {
    icon: HiOutlineOfficeBuilding,
    title: "Locais e sala",
    text: "Quem divide consultório cadastra o local, convida colegas e acompanha as despesas da sala. A agenda respeita o lugar em que você atende naquele dia.",
  },
  {
    icon: HiOutlineCash,
    title: "Financeiro",
    text: "Contas a receber, a pagar, pacotes e vencimentos. O início do painel já mostra o mês: o que entra, o que atrasou e o que já foi recebido.",
  },
  {
    icon: HiOutlineDocumentText,
    title: "Contratos",
    text: "Modelos editáveis e emissão a partir do cadastro do paciente. O texto fica salvo, versionado e pronto para gerar de novo quando o acompanhamento muda.",
  },
  {
    icon: HiOutlineClipboardList,
    title: "Relatórios",
    text: "Consultas salvas, favoritos e PDF do que o consultório precisa registrar. Monta uma vez, reutiliza no próximo mês, sem recomeçar a planilha.",
  },
];

const steps = [
  {
    n: "01",
    title: "Crie a sua conta",
    text: "Nome, e-mail e senha. São 30 dias de avaliação, sem cartão. O consultório você organiza depois, no seu ritmo.",
  },
  {
    n: "02",
    title: "Cadastre o básico",
    text: "Locais, horários, pacientes e valores. O sistema pede o essencial para agenda e financeiro funcionarem juntos — sem cadastro infinito no primeiro dia.",
  },
  {
    n: "03",
    title: "Acompanhe o mês",
    text: "No início do painel aparecem totais, a agenda do dia e quem ainda não pagou. O restante — contratos, relatórios, pacotes — fica a um clique.",
  },
];

const audiences = [
  {
    title: "Quem atende sozinho",
    text: "Um lugar só para agenda, pacientes e caixa. Sem planilha paralela, sem anotar no WhatsApp, sem misturar com a página que o paciente vê.",
  },
  {
    title: "Quem divide a sala",
    text: "O local é compartilhado, a conta é individual. Convites, despesas da sala e a grade de cada profissional ficam organizados sem um ser dono do calendário do outro.",
  },
  {
    title: "Quem atende em mais de um lugar",
    text: "Centro, online, outro consultório. O atendimento já nasce com o local certo, e o financeiro acompanha o que aconteceu em cada espaço.",
  },
];

function HeroLandscape() {
  return (
    <div className="landing-hero-art" aria-hidden>
      <Image
        src="/images/landing/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />
      <div className="landing-hero-veil" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="landing overflow-x-hidden">
      <section id="inicio" className="landing-hero">
        <HeroLandscape />
        <div className="container relative z-10 max-w-[760px] text-center text-white">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-white/70">Psy Manager</p>
          <h1 className="mx-auto mt-5 max-w-[14ch] text-[clamp(1.85rem,8vw,4.4rem)] leading-[1.12] text-white sm:max-w-none">
            Organize o consultório.
            <br />
            Cuide do que importa.
          </h1>
          <p className="mx-auto mt-6 max-w-[540px] px-1 text-[1.05rem] leading-[1.7] text-white/80 sm:text-[1.12rem]">
            Agenda, pacientes, financeiro e documentos em um painel só para o psicólogo. O sistema do consultório, separado da página da clínica.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/cadastro" className="btn-primary">
              Começar gratuitamente
            </Link>
            <Link href="/admin/login" className="btn-text">
              Já tem uma conta? Entrar
            </Link>
          </div>
        </div>
        <div className="relative z-10 mx-auto mt-14 w-[min(92%,1040px)] translate-y-8 sm:mt-16 sm:translate-y-12">
          <DashboardMock />
        </div>
      </section>

      <section className="bg-paper pt-24 pb-8">
        <div className="container grid gap-8 sm:grid-cols-3">
          {[
            ["Um painel", "Agenda, caixa e pacientes no mesmo lugar — sem abrir cinco abas para fechar o dia."],
            ["Conta individual", "Cada psicólogo entra com o próprio acesso e trabalha só os dados do seu consultório."],
            ["Feito para a sala", "Locais compartilhados, pacotes, contratos e relatórios que o atendimento realmente usa."],
          ].map(([title, text]) => (
            <div key={title}>
              <h3 className="text-2xl">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="produto" className="bg-paper py-24">
        <div className="container">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">O produto</p>
          <h2 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3.2rem)] leading-[1.15]">
            O painel que você usa depois da sessão
          </h2>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
            Psy Manager não é a vitrine da profissional. É o sistema de trás: quem veio, quem falta pagar, qual sala está ocupada e qual contrato precisa sair. Abaixo, o mesmo visual do painel — com dados de demonstração.
          </p>

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Agenda</p>
              <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)]">O dia inteiro, sem perder o local</h3>
              <p className="mt-4 leading-[1.75] text-muted">
                A agenda mostra o horário, o paciente e o consultório. Horários livres aparecem como “Livre — agendar”. Atendimentos agendados, em andamento ou concluídos ficam na grade do dia, com profissional e local.
              </p>
              <p className="mt-3 leading-[1.75] text-muted">
                Quem atende em mais de um lugar não mistura a grade: o local já vem no lançamento. Quem divide a sala vê o que acontece naquele espaço, sem herdar o calendário do colega.
              </p>
            </div>
            <AgendaMock />
          </div>

          <div className="mt-20 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="lg:order-2">
              <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Pacientes</p>
              <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)]">Ficha, histórico e próxima sessão</h3>
              <p className="mt-4 leading-[1.75] text-muted">
                A lista mostra quem está ativo, quem pausou e quando é o próximo encontro. Dentro da ficha ficam dados clínicos, anexos e o rastro do acompanhamento — o que importa para continuar o trabalho, não para publicar no site.
              </p>
              <p className="mt-3 leading-[1.75] text-muted">
                Pacotes de sessão, contratos e pagamentos se ligam ao cadastro. Não é um prontuário genérico de clínica médica: o recorte é o consultório de psicologia.
              </p>
            </div>
            <div className="lg:order-1">
              <PatientsMock />
            </div>
          </div>

          <div className="mt-20 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Financeiro</p>
              <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.4rem)]">O mês em três números</h3>
              <p className="mt-4 leading-[1.75] text-muted">
                A receber, em atraso e já recebido. Pacote de oito sessões, avulsa, vencimento do mês — o painel junta o que costuma ficar espalhado em planilha, bloco e PIX.
              </p>
              <p className="mt-3 leading-[1.75] text-muted">
                Contas a pagar e despesas da sala entram no mesmo universo. Quem divide o espaço vê o que é da clínica e o que é de cada um, sem conversa solta no fim do mês.
              </p>
            </div>
            <FinanceMock />
          </div>
        </div>
      </section>

      <section id="recursos" className="bg-white py-24">
        <div className="container">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">Recursos</p>
          <h2 className="mt-3 max-w-xl text-[clamp(2rem,4vw,3rem)] leading-[1.15]">Tudo o que o painel já cobre</h2>
          <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-muted">
            Não é uma lista de promessas. São os módulos que o consultório usa hoje: do primeiro cadastro ao PDF do relatório.
          </p>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="landing-card">
                <span className="landing-icon">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 text-[1.45rem] leading-tight">{title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="como-funciona" className="bg-paper py-24">
        <div className="container">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">Como funciona</p>
          <h2 className="mt-3 max-w-xl text-[clamp(2rem,4vw,3rem)] leading-[1.15]">Três passos para o consultório entrar no ritmo</h2>
          <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-muted">
            O primeiro dia não precisa de implementação. Entra, cadastra o essencial e já vê o mês.
          </p>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="landing-card">
                <span className="font-serif text-4xl text-teal/30">{step.n}</span>
                <h3 className="mt-4 text-[1.45rem]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="para-quem" className="bg-white py-24">
        <div className="container">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">Para quem</p>
          <h2 className="mt-3 max-w-2xl text-[clamp(2rem,4vw,3rem)] leading-[1.15]">Feito para o uso profissional — não para a vitrine</h2>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
            A landing da clínica continua sendo a página da profissional. O Psy Manager é o que fica do lado de cá: a operação do consultório, com conta própria e dados do seu trabalho.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {audiences.map((item) => (
              <article key={item.title} className="landing-card">
                <h3 className="text-[1.45rem]">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PlansSection />

      <section id="faq" className="bg-white py-24">
        <div className="container max-w-3xl">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">Perguntas frequentes</p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-[1.15]">O que já dá para saber antes de entrar</h2>
          <div className="mt-8 grid gap-3">
            {[
              ["Quanto tempo dura a avaliação?", "30 dias, contados da criação da conta. A data e a hora de término ficam no painel, em Assinatura."],
              ["Preciso de cartão para começar?", "Não. O cadastro não pede cartão e a aplicação não guarda número de cartão."],
              ["O que acontece quando os 30 dias acabam?", "Novos lançamentos param. Pacientes, agenda e financeiro já salvos permanecem, e a página de assinatura continua aberta."],
              ["Uma conta vê os pacientes de outra?", "Não. Cada profissional trabalha os dados do próprio consultório."],
              ["Como funciona o plano pago?", "Não há preço fixo nesta página. Você fala com um consultor no WhatsApp (49) 9 9826-6688 ou envia um e-mail. A avaliação de 30 dias continua gratuita e sem cartão."],
              ["O proprietário da plataforma lê prontuários?", "Não. A área da plataforma acompanha conta, plano e comunicação, sem abrir a ficha clínica."],
            ].map(([question, answer]) => (
              <details key={question} className="landing-card">
                <summary className="text-lg font-semibold text-teal">{question}</summary>
                <p className="mt-3 leading-relaxed text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="privacidade" className="bg-paper py-24">
        <div className="container max-w-3xl">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-teal/60">Privacidade</p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-[1.15]">Dados do consultório ficam no consultório</h2>
          <p className="mt-4 leading-relaxed text-muted">
            O cadastro pede nome, e-mail e senha. O nome do consultório fica para quando você quiser configurar o espaço. Dados de pacientes e evoluções ficam na conta de quem atende. O fim da avaliação não apaga esse material. O texto completo está nos termos e na política de privacidade — e ainda precisa de revisão jurídica antes de uma oferta comercial fechada.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/termos" className="font-semibold text-teal">Termos de uso</Link>
            <Link href="/privacidade" className="font-semibold text-teal">Política de privacidade</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
