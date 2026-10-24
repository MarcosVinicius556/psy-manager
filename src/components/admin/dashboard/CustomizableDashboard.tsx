"use client";

import { useEffect, useState, type DragEvent } from "react";
import { toast } from "react-toastify";
import {
  HiOutlineAdjustments,
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineEyeOff,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSelector,
  HiOutlineX,
} from "react-icons/hi";
import { Card, Empty, PageTitle } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import {
  HEIGHT_LABELS,
  WIDGET_HEIGHTS,
  WIDGET_WIDTHS,
  WIDTH_LABELS,
  defaultLayout,
  hiddenWidgets,
  hideWidget,
  isWidgetId,
  layoutsEqual,
  moveWidget,
  moveWidgetTo,
  setWidgetHeight,
  setWidgetWidth,
  showWidget,
  visibleWidgets,
  widgetDefinition,
  widgetGridClass,
  type DashboardLayout,
  type WidgetId,
  type WidgetLayout,
} from "@/lib/admin/dashboard-layout";
import { loadDashboardLayout, saveDashboardLayout } from "@/lib/admin/dashboard-store";
import { DASHBOARD_WIDGET_COMPONENTS } from "./widgets";

const chip = "inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-2 text-sm";

function WidgetToolbar({
  widget,
  first,
  last,
  onChange,
}: {
  widget: WidgetLayout;
  first: boolean;
  last: boolean;
  onChange: (update: (layout: DashboardLayout) => DashboardLayout) => void;
}) {
  const definition = widgetDefinition(widget.id);
  return (
    <div className="mb-2 rounded-md border border-dashed border-teal/40 bg-sky-soft px-3 py-2 text-xs text-ink">
      <div className="flex items-center gap-2">
        <HiOutlineSelector size={18} className="shrink-0 cursor-grab text-teal" aria-hidden title="Arraste para mover" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-teal" title={definition.title}>
          {definition.title}
        </p>
        <button
          type="button"
          className={`btn-chip ${chip}`}
          aria-label="Mover para cima"
          title="Mover para cima"
          disabled={first}
          onClick={() => onChange((layout) => moveWidget(layout, widget.id, -1))}
        >
          <HiOutlineChevronUp size={14} />
        </button>
        <button
          type="button"
          className={`btn-chip ${chip}`}
          aria-label="Mover para baixo"
          title="Mover para baixo"
          disabled={last}
          onClick={() => onChange((layout) => moveWidget(layout, widget.id, 1))}
        >
          <HiOutlineChevronDown size={14} />
        </button>
        <button
          type="button"
          className={`btn-chip ${chip} text-accent`}
          aria-label={`Remover ${definition.title}`}
          title="Remover do dashboard"
          onClick={() => onChange((layout) => hideWidget(layout, widget.id))}
        >
          <HiOutlineEyeOff size={14} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-muted">Largura</span>
        {WIDGET_WIDTHS.map((width) => (
          <button
            key={width}
            type="button"
            className={`${widget.width === width ? "btn-chip-active" : "btn-chip"} ${chip}`}
            aria-pressed={widget.width === width}
            onClick={() => onChange((layout) => setWidgetWidth(layout, widget.id, width))}
          >
            {WIDTH_LABELS[width]}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-muted">Altura</span>
        {WIDGET_HEIGHTS.map((height) => (
          <button
            key={height}
            type="button"
            className={`${widget.height === height ? "btn-chip-active" : "btn-chip"} ${chip}`}
            aria-pressed={widget.height === height}
            onClick={() => onChange((layout) => setWidgetHeight(layout, widget.id, height))}
          >
            {HEIGHT_LABELS[height]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomizableDashboard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [saved, setSaved] = useState<DashboardLayout | null>(null);
  const [draft, setDraft] = useState<DashboardLayout | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [overId, setOverId] = useState<WidgetId | null>(null);
  const editing = draft !== null;

  useEffect(() => {
    let active = true;
    loadDashboardLayout(uid).then((layout) => {
      if (active) setSaved(layout);
    });
    return () => {
      active = false;
    };
  }, [uid]);

  if (!saved) return <p className="text-muted">Carregando...</p>;

  const layout = draft ?? saved;
  const visible = visibleWidgets(layout);
  const hidden = hiddenWidgets(layout);

  const update = (change: (current: DashboardLayout) => DashboardLayout) => {
    setDraft((current) => change(current ?? saved));
  };

  const finish = async () => {
    if (!draft) return;
    if (layoutsEqual(draft, saved)) {
      setDraft(null);
      return;
    }
    setSaving(true);
    try {
      const where = await saveDashboardLayout(uid, draft);
      toast.success(where === "firestore" ? "Dashboard salvo." : "Dashboard salvo neste navegador.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar na sua conta. O layout ficou salvo apenas neste navegador.");
    } finally {
      setSaved(draft);
      setDraft(null);
      setSaving(false);
    }
  };

  const clearDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  const onDragStart = (event: DragEvent<HTMLDivElement>, id: WidgetId) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDragId(id);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>, id: WidgetId) => {
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overId !== id) setOverId(id);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, id: WidgetId) => {
    event.preventDefault();
    const from = dragId ?? event.dataTransfer.getData("text/plain");
    if (isWidgetId(from)) update((current) => moveWidgetTo(current, from, id));
    clearDrag();
  };

  const actions = editing ? (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-chip" onClick={() => setDraft(defaultLayout())} disabled={saving}>
        <HiOutlineRefresh size={16} />
        Restaurar padrão
      </button>
      <button type="button" className="btn-chip" onClick={() => setDraft(null)} disabled={saving}>
        <HiOutlineX size={16} />
        Cancelar
      </button>
      <button type="button" className="btn-row" onClick={finish} disabled={saving}>
        <HiOutlineCheck size={16} />
        {saving ? "Salvando..." : "Concluir"}
      </button>
    </div>
  ) : (
    <button type="button" className="btn-text" onClick={() => setDraft(saved)}>
      <HiOutlineAdjustments size={16} />
      Personalizar
    </button>
  );

  return (
    <div>
      <PageTitle title="Início" subtitle="O dia da clínica em um só lugar." action={actions} />
      {editing ? (
        <Card className="mb-6">
          <h2 className="text-xl font-medium text-teal">Personalizar dashboard</h2>
          <p className="mt-1 text-sm text-muted">
            Arraste os itens (ou use as setas) para mudar a ordem, escolha a largura e a altura de cada um e remova o que não
            quiser ver. No celular os itens ficam um embaixo do outro.
          </p>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink">Itens disponíveis para adicionar</p>
            {hidden.length === 0 ? (
              <p className="text-sm text-muted">Todos os itens já estão no dashboard.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hidden.map((item) => {
                  const definition = widgetDefinition(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="btn-chip"
                      title={definition.description}
                      onClick={() => update((current) => showWidget(current, item.id))}
                    >
                      <HiOutlinePlus size={16} />
                      {definition.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      ) : null}
      {visible.length === 0 ? (
        <Empty>Nenhum item no dashboard. Use “Personalizar” para adicionar.</Empty>
      ) : (
        <div className="grid grid-flow-row-dense grid-cols-12 gap-4 lg:gap-6">
          {visible.map((widget, index) => {
            const Widget = DASHBOARD_WIDGET_COMPONENTS[widget.id];
            const editClasses = editing
              ? `cursor-move rounded-md outline-2 outline-offset-4 outline-dashed [&>section]:pointer-events-none [&>section]:select-none ${
                  overId === widget.id && dragId !== widget.id ? "outline-teal" : "outline-leaf"
                } ${dragId === widget.id ? "opacity-50" : ""}`
              : "";
            return (
              <div
                key={widget.id}
                className={`flex min-w-0 flex-col [&>section]:flex-1 ${widgetGridClass(widget)} ${editClasses}`}
                draggable={editing}
                onDragStart={editing ? (event) => onDragStart(event, widget.id) : undefined}
                onDragOver={editing ? (event) => onDragOver(event, widget.id) : undefined}
                onDrop={editing ? (event) => onDrop(event, widget.id) : undefined}
                onDragEnd={editing ? clearDrag : undefined}
              >
                {editing ? (
                  <WidgetToolbar widget={widget} first={index === 0} last={index === visible.length - 1} onChange={update} />
                ) : null}
                <Widget />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}