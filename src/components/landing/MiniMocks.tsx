/** Compact UI previews for hero stack and collages — no photos of real people. */

export function MiniAgendaCard() {
  const slots = [
    ["09:00", "Livre", "sage"],
    ["10:00", "Sessão", "teal"],
    ["11:00", "Sessão", "teal"],
    ["14:00", "Online", "accent"],
  ] as const;
  return (
    <div className="flex h-full flex-col bg-paper p-4 font-sans text-ink">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Agenda · Hoje</p>
      <p className="mt-1 text-lg font-semibold text-teal">Quinta, 23 out</p>
      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {slots.map(([time, label, tone]) => (
          <li
            key={time}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] ${
              tone === "teal"
                ? "border-teal/20 bg-white"
                : tone === "accent"
                  ? "border-[#e8cfc4] bg-[#faf5f2]"
                  : "border-[#d7e0d8] bg-white/80"
            }`}
          >
            <span className="font-num font-medium">{time}</span>
            <span className={tone === "sage" ? "text-muted" : "font-medium text-teal"}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniChartCard() {
  return (
    <div className="flex h-full flex-col bg-white p-4 font-sans text-ink">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Prontuário</p>
      <p className="mt-1 font-semibold text-teal">Evolução da sessão</p>
      <div className="mt-3 flex-1 space-y-2 rounded-xl bg-paper p-3 text-[10px] leading-relaxed text-muted">
        <p>Registro clínico com data e hora. Anexos e histórico na mesma ficha.</p>
        <p className="rounded-lg border border-[#d7e0d8] bg-white px-2 py-1.5 text-ink">Última sessão · evolução salva</p>
      </div>
      <span className="mt-2 inline-flex w-fit rounded-md border border-leaf bg-sky-soft px-2 py-0.5 text-[9px] font-semibold text-teal">
        LGPD
      </span>
    </div>
  );
}

export function MiniReceiptCard() {
  return (
    <div className="flex h-full flex-col bg-[#faf8f4] p-4 font-sans text-ink">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Recibo</p>
      <p className="mt-1 text-sm font-semibold">Receita Saúde</p>
      <div className="mt-3 flex-1 rounded-xl border border-[#e8cfc4] bg-white p-3 text-[10px]">
        <div className="flex justify-between border-b border-[#f0e8e4] pb-2">
          <span className="text-muted">Atendimento</span>
          <span className="font-medium">Psicoterapia</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-muted">Valor</span>
          <span className="font-num font-semibold text-teal">R$ 280,00</span>
        </div>
      </div>
      <span className="mt-2 text-[9px] text-muted">Pronto para o paciente declarar</span>
    </div>
  );
}

export function MiniFinanceCard() {
  return (
    <div className="flex h-full flex-col bg-teal p-4 font-sans text-white">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Financeiro</p>
      <p className="mt-1 text-lg font-semibold">Outubro</p>
      <div className="mt-4 grid flex-1 grid-cols-1 gap-2">
        {[
          ["A receber", "R$ 4.200"],
          ["Recebido", "R$ 6.200"],
          ["Em atraso", "R$ 650"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/12 px-3 py-2">
            <p className="text-[9px] text-white/65">{k}</p>
            <p className="font-num text-sm font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const heroStackCards = [
  { id: "agenda", rotate: -6, bg: "bg-white", content: <MiniAgendaCard /> },
  { id: "chart", rotate: -2, bg: "bg-white", content: <MiniChartCard /> },
  { id: "receipt", rotate: 2, bg: "bg-white", content: <MiniReceiptCard /> },
  { id: "finance", rotate: 6, bg: "bg-teal", content: <MiniFinanceCard /> },
];
