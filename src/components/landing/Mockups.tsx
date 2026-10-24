import type { ReactNode } from "react";
import {
  HiOutlineBell,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiArrowDown,
  HiArrowUp,
} from "react-icons/hi";
import { HiOutlineBuildingOffice } from "react-icons/hi2";

type Screen = "inicio" | "agenda" | "pacientes" | "financeiro";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const OCT_CELLS = [...Array(3).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];
const MARKED = new Set([9, 10, 14, 15, 20, 22, 23]);

function Chrome({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] bg-white shadow-[0_28px_80px_rgba(23,47,51,0.22)]">
      <div className="flex items-center gap-2 border-b border-[#d7e0d8] bg-[#eef3ee] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d9b4a6]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d8cca3]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#a8c4a8]" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 font-sans text-[11px] text-muted">
          /admin
        </span>
      </div>
      <div className="pointer-events-none select-none font-sans text-ink">{children}</div>
    </div>
  );
}

function Pill({
  children,
  tone = "sage",
}: {
  children: ReactNode;
  tone?: "sage" | "accent" | "muted" | "teal";
}) {
  const tones = {
    sage: "border-leaf bg-sky-soft text-teal",
    accent: "border-[#e8cfc4] bg-[#f6e6df] text-accent",
    muted: "border-[#d7e0d8] bg-white text-muted",
    teal: "border-teal bg-teal text-white",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Shell({ current, children }: { current: Screen; children: ReactNode }) {
  const clinicaOpen = current === "agenda" || current === "pacientes";
  const financeiroOpen = current === "financeiro";
  return (
    <div className="flex min-h-[420px] bg-paper">
      <aside className="hidden w-[200px] shrink-0 flex-col bg-teal px-3 pt-5 pb-4 text-white sm:flex">
        <div className="flex items-start justify-between px-1">
          <img src="/images/logo/mark.png" alt="" className="h-8 w-auto" />
          <span className="grid h-7 w-7 place-items-center rounded-md text-white/80">
            <HiOutlineChevronLeft size={16} />
          </span>
        </div>
        <nav className="mt-5 flex flex-1 flex-col gap-1 text-[11px] font-medium">
          <NavItem active={current === "inicio"} icon={<HiOutlineHome size={15} />} label="Início" />
          <NavGroup label="Clínica" icon={<HiOutlineBuildingOffice size={15} />} open={clinicaOpen}>
            <NavItem nested active={current === "agenda"} icon={<HiOutlineCalendar size={14} />} label="Agenda" />
            <NavItem nested active={current === "pacientes"} icon={<HiOutlineUsers size={14} />} label="Pacientes" />
            <NavItem nested icon={<HiOutlineOfficeBuilding size={14} />} label="Locais" />
            <NavItem nested icon={<HiOutlineClipboardList size={14} />} label="Pacotes" />
          </NavGroup>
          <NavGroup label="Financeiro" icon={<HiOutlineCash size={15} />} open={financeiroOpen}>
            <NavItem nested active={current === "financeiro"} icon={<HiOutlineCash size={14} />} label="Contas a receber" />
            <NavItem nested icon={<HiOutlineCurrencyDollar size={14} />} label="Contas a pagar" />
          </NavGroup>
          <NavGroup label="Operacional" icon={<HiOutlineBriefcase size={15} />}>
            <NavItem nested icon={<HiOutlineDocumentText size={14} />} label="Modelo de contrato" />
            <NavItem nested icon={<HiOutlineChartBar size={14} />} label="Gerador de relatórios" />
          </NavGroup>
          <NavItem icon={<HiOutlineBell size={15} />} label="Notificações" />
          <NavItem icon={<HiOutlineCog size={15} />} label="Configurações" />
        </nav>
        <div className="border-t border-white/15 pt-3">
          <div className="flex items-center gap-2 px-1">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/15 text-[11px] font-semibold">HA</span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">Helena Alves</p>
              <p className="truncate text-[10px] text-white/70">helena@consultorio.com</p>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-2 px-2 py-1.5 text-[11px] text-white/80">
            <HiOutlineLogout size={14} /> Sair
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-hidden px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </div>
  );
}

function NavItem({
  label,
  icon,
  active = false,
  nested = false,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  nested?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border py-2 text-[11px] ${
        nested ? "pl-7 pr-2" : "px-2.5"
      } ${active ? "border-white bg-white text-teal" : "border-transparent text-white/80"}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}

function NavGroup({
  label,
  icon,
  open = false,
  children,
}: {
  label: string;
  icon: ReactNode;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-[11px] text-white/80">
        {icon}
        <span className="flex-1 truncate">{label}</span>
        <HiOutlineChevronDown size={12} className={open ? "rotate-180" : ""} />
      </div>
      {open && <div className="mt-0.5 flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-md bg-white p-3 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-4 ${className}`}>{children}</section>;
}

function PageTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-[clamp(1.35rem,2vw,1.7rem)] font-medium text-teal">{title}</h2>
        <p className="mt-0.5 text-[11px] text-muted sm:text-xs">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function MonthCard({
  title,
  value,
  change,
  invert = false,
  footnote,
}: {
  title: string;
  value: string;
  change: { dir: "up" | "down"; pct: string };
  invert?: boolean;
  footnote?: string;
}) {
  const tone = invert
    ? change.dir === "up"
      ? "text-[#b42318]"
      : "text-[#1f7a45]"
    : change.dir === "up"
      ? "text-[#1f7a45]"
      : "text-[#b42318]";
  return (
    <Card>
      <p className="text-[11px] text-muted">{title}</p>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="grid h-6 w-6 place-items-center rounded-md border border-teal text-teal">
          <HiOutlineChevronLeft size={14} />
        </span>
        <p className="text-[11px] font-medium text-ink">Outubro de 2026</p>
        <span className="grid h-6 w-6 place-items-center rounded-md border border-teal text-teal">
          <HiOutlineChevronRight size={14} />
        </span>
      </div>
      <p className={`font-num mt-2 text-xl font-semibold sm:text-2xl ${tone}`}>{value}</p>
      <p className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
        {change.dir === "up" ? <HiArrowUp size={12} /> : <HiArrowDown size={12} />}
        {change.pct}
      </p>
      {footnote ? <p className="font-num mt-1 text-[10px] text-muted">{footnote}</p> : null}
    </Card>
  );
}

function Calendar({ selected = 20 }: { selected?: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8ea] text-teal">
          <HiOutlineChevronLeft size={14} />
        </span>
        <span className="text-xs font-medium text-teal">Outubro 2026</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8ea] text-teal">
          <HiOutlineChevronRight size={14} />
        </span>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-semibold tracking-wide text-muted uppercase">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-0.5">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {OCT_CELLS.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const active = day === selected;
          return (
            <span
              key={day}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[11px] ${
                active ? "bg-teal text-white" : "text-ink"
              }`}
            >
              {day}
              {MARKED.has(day) && (
                <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${active ? "bg-white" : "bg-accent"}`} />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-[#d7e0d8] bg-sky-soft px-2 py-1.5 text-[9px] font-semibold tracking-wide text-teal uppercase ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`font-num border-b border-[#eef2ee] px-2 py-1.5 align-middle text-[11px] ${className}`}>{children}</td>;
}

export function DashboardMock() {
  return (
    <Chrome>
      <Shell current="inicio">
        <PageTitle title="Início" subtitle="O dia da clínica em um só lugar." />
        <div className="mb-3 grid gap-2.5 sm:grid-cols-3">
          <MonthCard title="Total a receber" value="R$ 8.400,00" change={{ dir: "up", pct: "12%" }} />
          <MonthCard title="Total em atraso" value="R$ 650,00" change={{ dir: "down", pct: "18%" }} invert />
          <MonthCard title="Total recebido" value="R$ 6.200,00" change={{ dir: "up", pct: "8%" }} />
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2.5">
          <Card>
            <p className="text-[11px] text-muted">Pacientes ativos</p>
            <p className="font-num mt-1 text-3xl font-semibold text-teal sm:text-4xl">24</p>
          </Card>
          <Card>
            <p className="text-[11px] text-muted">Lançamentos futuros</p>
            <p className="font-num mt-1 text-3xl font-semibold text-teal sm:text-4xl">7</p>
          </Card>
          <Card>
            <p className="text-[11px] text-muted">Pacientes em Atraso</p>
            <p className="font-num mt-1 text-3xl font-semibold text-accent sm:text-4xl">2</p>
          </Card>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <p className="text-[11px] font-medium text-ink">Local em validação: Consultório Centro</p>
            <p className="mt-1 mb-3 text-[10px] text-muted">
              Estas marcações são do local Consultório Centro, de qualquer profissional. A grade livre é a de Helena Alves.
            </p>
            <Calendar />
            <div className="mt-3 border-t border-[#e7eee8] pt-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-serif text-lg text-teal">20/10/2026</p>
                  <p className="text-[10px] text-muted">Agenda de Consultório Centro</p>
                </div>
                <span className="btn-text px-2 py-1 text-[10px]">Abrir na agenda</span>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <Th>Horário</Th>
                    <Th>Paciente</Th>
                    <Th className="hidden sm:table-cell">Profissional</Th>
                    <Th>Local</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>14:00–14:50</Td>
                    <Td className="font-medium text-teal">Ana Souza</Td>
                    <Td className="hidden sm:table-cell">Helena Alves</Td>
                    <Td>Consultório Centro</Td>
                    <Td>
                      <Pill>Agendado</Pill>
                    </Td>
                  </tr>
                  <tr>
                    <Td>15:00–15:50</Td>
                    <Td className="font-medium text-teal">Pedro Lima</Td>
                    <Td className="hidden sm:table-cell">Helena Alves</Td>
                    <Td>Consultório Centro</Td>
                    <Td>
                      <Pill tone="teal">Concluído</Pill>
                    </Td>
                  </tr>
                  <tr>
                    <Td>16:30–17:20</Td>
                    <Td className="font-medium text-teal">Marina Costa</Td>
                    <Td className="hidden sm:table-cell">Helena Alves</Td>
                    <Td>Online · Consultório Centro</Td>
                    <Td>
                      <Pill>Agendado</Pill>
                    </Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          <div className="hidden grid-cols-1 gap-3 lg:grid">
            <Card>
              <h3 className="mb-2 font-serif text-lg font-medium text-teal">Lançamentos futuros</h3>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <Th>Paciente</Th>
                    <Th>Descrição</Th>
                    <Th>Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>
                      <p className="font-medium">Carla Mendes</p>
                      <p className="text-[10px] text-muted">22/10/2026</p>
                    </Td>
                    <Td>Pacote 8 sessões</Td>
                    <Td className="font-semibold">R$ 960,00</Td>
                  </tr>
                  <tr>
                    <Td>
                      <p className="font-medium">João Ribeiro</p>
                      <p className="text-[10px] text-muted">23/10/2026</p>
                    </Td>
                    <Td>Sessão avulsa</Td>
                    <Td className="font-semibold">R$ 180,00</Td>
                  </tr>
                </tbody>
              </table>
              <span className="btn-text mt-3 px-2 py-1 text-[10px]">Ver financeiro</span>
            </Card>
            <Card>
              <h3 className="mb-2 font-serif text-lg font-medium text-teal">Não pagaram</h3>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <Th>Paciente</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td className="font-medium text-teal">Helena Dias</Td>
                  </tr>
                  <tr>
                    <Td className="font-medium text-teal">Lucas Ferreira</Td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </Shell>
    </Chrome>
  );
}

export function AgendaMock() {
  const slots = [
    { time: "14:00", kind: "busy" as const, range: "14:00–14:50", name: "Ana Souza", extra: "Helena Alves · Consultório Centro" },
    { time: "14:50", kind: "free" as const },
    { time: "15:00", kind: "busy" as const, range: "15:00–15:50", name: "Pedro Lima", extra: "Helena Alves · Consultório Centro" },
    { time: "15:50", kind: "free" as const },
    { time: "16:00", kind: "free" as const },
    { time: "16:30", kind: "busy" as const, range: "16:30–17:20", name: "Marina Costa", extra: "Helena Alves · Online · Consultório Centro" },
    { time: "17:20", kind: "free" as const },
  ];
  return (
    <Chrome>
      <Shell current="agenda">
        <PageTitle
          title="Agenda"
          subtitle="Local em validação: Consultório Centro. Horários livres de Helena Alves."
          action={<span className="btn-primary px-3 py-1.5 text-[11px]">Novo atendimento</span>}
        />
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="btn-chip-active px-2.5 py-1 text-[10px]">Hoje</span>
          <span className="btn-chip px-2.5 py-1 text-[10px]">Semana</span>
          <span className="btn-chip px-2.5 py-1 text-[10px]">Mês</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <p className="mb-2 text-[11px] text-ink">
              Marcações do local <strong>Consultório Centro</strong>
            </p>
            <Calendar />
          </Card>
          <Card>
            <h3 className="mb-0.5 font-serif text-lg font-medium text-teal">20/10/2026</h3>
            <p className="text-[11px] font-medium text-ink">Consultório Centro</p>
            <p className="mb-3 text-[10px] text-muted">Grade de Helena Alves. Livre só quando você e este local estão disponíveis.</p>
            <div>
              {slots.map((slot) => (
                <div key={slot.time} className="grid grid-cols-[48px_1fr] gap-2 border-b border-[#e7eee8] py-1">
                  <span className="pt-1.5 text-[11px] font-medium text-muted">{slot.time}</span>
                  {slot.kind === "free" ? (
                    <span className="rounded-md px-2 py-1.5 text-left text-[11px] text-muted">Livre — agendar</span>
                  ) : (
                    <span className="rounded-md bg-sky-soft px-2 py-1.5 text-[11px]">
                      <strong>
                        {slot.range} {slot.name}
                      </strong>
                      <span className="mt-0.5 block text-muted">{slot.extra}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Shell>
    </Chrome>
  );
}

export function PatientsMock() {
  const rows = [
    ["Ana Souza", "(11) 98812-4401", "ana.souza@email.com", "ativo"],
    ["Pedro Lima", "(11) 97730-2198", "pedro.lima@email.com", "ativo"],
    ["Marina Costa", "(11) 99645-8820", "marina.costa@email.com", "ativo"],
    ["Carla Mendes", "(11) 98122-3344", "carla.mendes@email.com", "ativo"],
    ["Helena Dias", "(11) 97301-5567", "helena.dias@email.com", "inativo"],
  ] as const;
  return (
    <Chrome>
      <Shell current="pacientes">
        <PageTitle
          title="Pacientes"
          subtitle="Cadastro e acompanhamento."
          action={<span className="btn-primary px-3 py-1.5 text-[11px]">Novo paciente</span>}
        />
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="btn-chip-active px-2.5 py-1 text-[10px]">Todos</span>
          <span className="btn-chip px-2.5 py-1 text-[10px]">Ativos</span>
          <span className="btn-chip px-2.5 py-1 text-[10px]">Inativos</span>
        </div>
        <Card>
          <div className="mb-3 rounded-md border border-[#e2e8ea] bg-white px-3 py-2 text-[11px] text-muted">
            Buscar por nome, telefone ou e-mail
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Telefone</Th>
                <Th className="hidden sm:table-cell">E-mail</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, phone, email, status]) => (
                <tr key={name}>
                  <Td className="font-medium text-teal">{name}</Td>
                  <Td>{phone}</Td>
                  <Td className="hidden sm:table-cell">{email}</Td>
                  <Td>
                    <Pill tone={status === "ativo" ? "sage" : "muted"}>{status === "ativo" ? "Ativo" : "Inativo"}</Pill>
                  </Td>
                  <Td className="text-right">
                    <span className="inline-flex justify-end gap-1">
                      <span className="btn-row px-2 py-0.5 text-[10px]">Detalhes</span>
                      <span className="btn-text px-2 py-0.5 text-[10px]">Editar</span>
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Shell>
    </Chrome>
  );
}

export function FinanceMock() {
  const rows = [
    ["Ana Souza", "Pacote 8 sessões", "20/10/2026", "Pix", "R$ 960,00", "R$ 0,00", "pago"],
    ["Pedro Lima", "Sessão avulsa", "20/10/2026", "Pix", "R$ 180,00", "R$ 180,00", "em_haver"],
    ["Marina Costa", "Pacote 4 sessões", "22/10/2026", "Cartão", "R$ 640,00", "R$ 320,00", "agendado"],
    ["Helena Dias", "Sessão avulsa", "05/10/2026", "Pix", "R$ 180,00", "R$ 180,00", "nao_pago"],
  ] as const;
  return (
    <Chrome>
      <Shell current="financeiro">
        <PageTitle
          title="Contas a receber"
          subtitle="Pagamentos previstos, recebidos e em aberto."
          action={<span className="btn-primary px-3 py-1.5 text-[11px]">Novo lançamento</span>}
        />
        <div className="mb-3 grid gap-2.5 sm:grid-cols-3">
          <MonthCard
            title="Total recebido"
            value="R$ 6.200,00"
            change={{ dir: "up", pct: "8%" }}
            footnote="Pacientes R$ 5.840,00 · Renda externa R$ 360,00"
          />
          <MonthCard title="A receber no mês" value="R$ 8.400,00" change={{ dir: "up", pct: "12%" }} footnote="O que ainda falta receber neste mês vigente." />
          <MonthCard title="Em atraso" value="R$ 650,00" change={{ dir: "down", pct: "18%" }} invert footnote="Em haver com vencimento antes de hoje." />
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="btn-chip-active px-2.5 py-1 text-[10px]">Lançamentos</span>
          <span className="btn-chip px-2.5 py-1 text-[10px]">Pacientes em dia</span>
          <span className="btn-chip px-2.5 py-1 text-[10px]">Não pagaram</span>
        </div>
        <Card>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <Th>Paciente</Th>
                <Th>Descrição</Th>
                <Th>Vencimento</Th>
                <Th className="hidden md:table-cell">Forma</Th>
                <Th>Acordado</Th>
                <Th>Faltante</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, desc, due, method, agreed, rest, status]) => (
                <tr key={name}>
                  <Td className="font-medium text-teal">{name}</Td>
                  <Td>{desc}</Td>
                  <Td>{due}</Td>
                  <Td className="hidden md:table-cell">{method}</Td>
                  <Td className="font-semibold">{agreed}</Td>
                  <Td>{rest}</Td>
                  <Td>
                    <Pill tone={status === "pago" ? "teal" : status === "nao_pago" ? "accent" : "sage"}>
                      {status === "pago" ? "Pago" : status === "em_haver" ? "Em haver" : status === "agendado" ? "Agendado" : "Não pago"}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <span className={rest === "R$ 0,00" ? "btn-text px-2 py-0.5 text-[10px]" : "btn-row px-2 py-0.5 text-[10px]"}>
                      {rest === "R$ 0,00" ? "Histórico" : "Receber"}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Shell>
    </Chrome>
  );
}
