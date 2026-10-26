export const DASHBOARD_LAYOUT_VERSION = 1;

export const WIDGET_WIDTHS = [4, 6, 8, 12] as const;
export type WidgetWidth = (typeof WIDGET_WIDTHS)[number];

export const WIDGET_HEIGHTS = ["compact", "normal", "tall"] as const;
export type WidgetHeight = (typeof WIDGET_HEIGHTS)[number];

export const WIDGET_IDS = [
  "receivable",
  "overdue",
  "received",
  "activePatients",
  "noShowRate",
  "retention90",
  "avgTicket",
  "forecastReceived",
  "avgSessionRating",
  "futureCount",
  "debtorsCount",
  "calendar",
  "futureList",
  "debtorsList",
] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

export type WidgetDefinition = {
  id: WidgetId;
  title: string;
  description: string;
  defaultWidth: WidgetWidth;
  defaultHeight: WidgetHeight;
  defaultVisible: boolean;
};

export type WidgetLayout = {
  id: WidgetId;
  visible: boolean;
  width: WidgetWidth;
  height: WidgetHeight;
};

export type DashboardLayout = {
  version: number;
  widgets: WidgetLayout[];
};

export const WIDTH_LABELS: Record<WidgetWidth, string> = {
  4: "1/3",
  6: "1/2",
  8: "2/3",
  12: "Inteira",
};

export const HEIGHT_LABELS: Record<WidgetHeight, string> = {
  compact: "Compacta",
  normal: "Normal",
  tall: "Alta",
};

/** Catalog of every widget, in the default order of the dashboard. */
export const DASHBOARD_WIDGETS: WidgetDefinition[] = [
  { id: "receivable", title: "Total a receber", description: "Valores a receber no mês escolhido.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "overdue", title: "Total em atraso", description: "Valores vencidos e não pagos por mês.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "received", title: "Total recebido", description: "Valores recebidos no mês escolhido.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "activePatients", title: "Pacientes ativos", description: "Quantidade de pacientes ativos.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "noShowRate", title: "Taxa de faltas (90 dias)", description: "Percentual de sessões marcadas como falta.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "retention90", title: "Retenção em 90 dias", description: "Pacientes antigos com sessão recente.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "avgTicket", title: "Ticket médio", description: "Valor médio dos pagamentos quitados.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "forecastReceived", title: "Previsto x recebido", description: "Comparativo do mês corrente.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "avgSessionRating", title: "Nota média das avaliações", description: "Média das avaliações públicas de sessão.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "futureCount", title: "Lançamentos futuros (total)", description: "Quantidade de pagamentos agendados.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "debtorsCount", title: "Pacientes em atraso", description: "Quantidade de pacientes que não pagaram.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "calendar", title: "Calendário e atendimentos do dia", description: "Calendário do mês e a agenda do dia selecionado.", defaultWidth: 8, defaultHeight: "tall", defaultVisible: true },
  { id: "futureList", title: "Lançamentos futuros", description: "Próximos pagamentos agendados.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
  { id: "debtorsList", title: "Não pagaram", description: "Lista de pacientes inadimplentes.", defaultWidth: 4, defaultHeight: "normal", defaultVisible: true },
];

const definitions = new Map<WidgetId, WidgetDefinition>(DASHBOARD_WIDGETS.map((item) => [item.id, item]));

export function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && definitions.has(value as WidgetId);
}

export function isWidgetWidth(value: unknown): value is WidgetWidth {
  return typeof value === "number" && (WIDGET_WIDTHS as readonly number[]).includes(value);
}

export function isWidgetHeight(value: unknown): value is WidgetHeight {
  return typeof value === "string" && (WIDGET_HEIGHTS as readonly string[]).includes(value);
}

export function widgetDefinition(id: WidgetId): WidgetDefinition {
  return definitions.get(id) as WidgetDefinition;
}

function defaultWidget(definition: WidgetDefinition): WidgetLayout {
  return {
    id: definition.id,
    visible: definition.defaultVisible,
    width: definition.defaultWidth,
    height: definition.defaultHeight,
  };
}

export function defaultLayout(): DashboardLayout {
  return { version: DASHBOARD_LAYOUT_VERSION, widgets: DASHBOARD_WIDGETS.map(defaultWidget) };
}

/**
 * Turns anything loaded from storage into a valid layout: unknown or repeated widgets are dropped,
 * invalid sizes fall back to the widget default and widgets missing from the saved layout
 * (for example, widgets created after the layout was saved) are appended at the end.
 */
export function sanitizeLayout(raw: unknown): DashboardLayout {
  const source = raw && typeof raw === "object" ? (raw as { widgets?: unknown }).widgets : undefined;
  if (!Array.isArray(source)) return defaultLayout();
  const seen = new Set<WidgetId>();
  const widgets: WidgetLayout[] = [];
  for (const entry of source) {
    if (!entry || typeof entry !== "object") continue;
    const data = entry as Record<string, unknown>;
    if (!isWidgetId(data.id) || seen.has(data.id)) continue;
    const definition = widgetDefinition(data.id);
    seen.add(data.id);
    widgets.push({
      id: data.id,
      visible: typeof data.visible === "boolean" ? data.visible : definition.defaultVisible,
      width: isWidgetWidth(data.width) ? data.width : definition.defaultWidth,
      height: isWidgetHeight(data.height) ? data.height : definition.defaultHeight,
    });
  }
  for (const definition of DASHBOARD_WIDGETS) {
    if (!seen.has(definition.id)) widgets.push(defaultWidget(definition));
  }
  return { version: DASHBOARD_LAYOUT_VERSION, widgets };
}

function patchWidget(layout: DashboardLayout, id: WidgetId, patch: Partial<Omit<WidgetLayout, "id">>): DashboardLayout {
  return { ...layout, widgets: layout.widgets.map((item) => (item.id === id ? { ...item, ...patch } : item)) };
}

export function visibleWidgets(layout: DashboardLayout) {
  return layout.widgets.filter((item) => item.visible);
}

export function hiddenWidgets(layout: DashboardLayout) {
  return layout.widgets.filter((item) => !item.visible);
}

export function hideWidget(layout: DashboardLayout, id: WidgetId) {
  return patchWidget(layout, id, { visible: false });
}

/** Shows a hidden widget again, placing it at the end of the visible widgets. */
export function showWidget(layout: DashboardLayout, id: WidgetId) {
  const target = layout.widgets.find((item) => item.id === id);
  if (!target) return layout;
  const rest = layout.widgets.filter((item) => item.id !== id);
  const lastVisible = rest.reduce((last, item, index) => (item.visible ? index : last), -1);
  const widgets = [...rest];
  widgets.splice(lastVisible + 1, 0, { ...target, visible: true });
  return { ...layout, widgets };
}

export function setWidgetWidth(layout: DashboardLayout, id: WidgetId, width: WidgetWidth) {
  return isWidgetWidth(width) ? patchWidget(layout, id, { width }) : layout;
}

export function setWidgetHeight(layout: DashboardLayout, id: WidgetId, height: WidgetHeight) {
  return isWidgetHeight(height) ? patchWidget(layout, id, { height }) : layout;
}

/** Steps the width to the next smaller (-1) or larger (+1) option, stopping at the ends. */
export function stepWidgetWidth(layout: DashboardLayout, id: WidgetId, direction: -1 | 1) {
  const target = layout.widgets.find((item) => item.id === id);
  if (!target) return layout;
  const index = WIDGET_WIDTHS.indexOf(target.width);
  const next = WIDGET_WIDTHS[Math.min(WIDGET_WIDTHS.length - 1, Math.max(0, index + direction))];
  return patchWidget(layout, id, { width: next });
}

/** Moves a widget one place up (-1) or down (+1) among the visible widgets. */
export function moveWidget(layout: DashboardLayout, id: WidgetId, direction: -1 | 1) {
  const visible = visibleWidgets(layout);
  const index = visible.findIndex((item) => item.id === id);
  const neighbor = visible[index + direction];
  if (index < 0 || !neighbor) return layout;
  return moveWidgetTo(layout, id, neighbor.id);
}

/** Moves a widget to the position currently held by another widget (drag and drop). */
export function moveWidgetTo(layout: DashboardLayout, id: WidgetId, targetId: WidgetId) {
  if (id === targetId) return layout;
  const from = layout.widgets.findIndex((item) => item.id === id);
  const to = layout.widgets.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0) return layout;
  const widgets = [...layout.widgets];
  const [moved] = widgets.splice(from, 1);
  widgets.splice(to, 0, moved);
  return { ...layout, widgets };
}

export function layoutsEqual(a: DashboardLayout, b: DashboardLayout) {
  if (a.widgets.length !== b.widgets.length) return false;
  return a.widgets.every((item, index) => {
    const other = b.widgets[index];
    return item.id === other.id && item.visible === other.visible && item.width === other.width && item.height === other.height;
  });
}

const widthClasses: Record<WidgetWidth, string> = {
  4: "md:col-span-6 lg:col-span-4",
  6: "md:col-span-6 lg:col-span-6",
  8: "md:col-span-12 lg:col-span-8",
  12: "md:col-span-12 lg:col-span-12",
};

const heightClasses: Record<WidgetHeight, string> = {
  compact: "self-start [&>section]:max-h-72 [&>section]:overflow-y-auto",
  normal: "",
  tall: "lg:row-span-2 [&>section]:min-h-[32rem]",
};

/** Tailwind classes for a widget on the 12-column dashboard grid (always full width on mobile). */
export function widgetGridClass(widget: Pick<WidgetLayout, "width" | "height">) {
  return ["col-span-12", widthClasses[widget.width], heightClasses[widget.height]].filter(Boolean).join(" ");
}