import { describe, expect, it } from "vitest";
import {
  DASHBOARD_WIDGETS,
  defaultLayout,
  hiddenWidgets,
  hideWidget,
  layoutsEqual,
  moveWidget,
  moveWidgetTo,
  sanitizeLayout,
  setWidgetHeight,
  setWidgetWidth,
  showWidget,
  stepWidgetWidth,
  visibleWidgets,
  widgetGridClass,
  type WidgetWidth,
} from "./dashboard-layout";

const ids = (list: { id: string }[]) => list.map((item) => item.id);

describe("layout padrão", () => {
  it("mostra todos os widgets na ordem do catálogo", () => {
    const layout = defaultLayout();
    expect(ids(layout.widgets)).toEqual(ids(DASHBOARD_WIDGETS));
    expect(hiddenWidgets(layout)).toEqual([]);
  });

  it("devolve uma cópia nova a cada chamada", () => {
    const a = defaultLayout();
    a.widgets[0].visible = false;
    expect(defaultLayout().widgets[0].visible).toBe(true);
  });
});

describe("sanitização do layout salvo", () => {
  it("volta ao padrão quando o valor salvo é inválido", () => {
    expect(layoutsEqual(sanitizeLayout(null), defaultLayout())).toBe(true);
    expect(layoutsEqual(sanitizeLayout("lixo"), defaultLayout())).toBe(true);
    expect(layoutsEqual(sanitizeLayout({ widgets: "x" }), defaultLayout())).toBe(true);
  });

  it("descarta widgets desconhecidos e repetidos e acrescenta os novos no fim", () => {
    const layout = sanitizeLayout({
      version: 1,
      widgets: [
        { id: "debtorsList", visible: true, width: 12, height: "tall" },
        { id: "widget-removido", visible: true, width: 4, height: "normal" },
        { id: "debtorsList", visible: false, width: 4, height: "compact" },
        { id: "calendar", visible: false, width: 6, height: "normal" },
      ],
    });
    expect(layout.widgets[0]).toEqual({ id: "debtorsList", visible: true, width: 12, height: "tall" });
    expect(layout.widgets[1]).toEqual({ id: "calendar", visible: false, width: 6, height: "normal" });
    expect(layout.widgets).toHaveLength(DASHBOARD_WIDGETS.length);
    expect(new Set(ids(layout.widgets)).size).toBe(DASHBOARD_WIDGETS.length);
    expect(ids(layout.widgets).slice(2)).toEqual(ids(DASHBOARD_WIDGETS).filter((id) => id !== "debtorsList" && id !== "calendar"));
  });

  it("corrige tamanhos inválidos com o padrão do widget", () => {
    const layout = sanitizeLayout({ widgets: [{ id: "calendar", visible: "sim", width: 5, height: "gigante" }] });
    expect(layout.widgets[0]).toEqual({ id: "calendar", visible: true, width: 8, height: "tall" });
  });
});

describe("edição", () => {
  it("oculta e mostra de novo no fim dos visíveis", () => {
    let layout = hideWidget(defaultLayout(), "receivable");
    expect(ids(hiddenWidgets(layout))).toEqual(["receivable"]);
    layout = hideWidget(layout, "debtorsList");
    layout = showWidget(layout, "receivable");
    const visible = ids(visibleWidgets(layout));
    expect(visible[visible.length - 1]).toBe("receivable");
    expect(ids(hiddenWidgets(layout))).toEqual(["debtorsList"]);
  });

  it("move para cima e para baixo apenas entre widgets visíveis", () => {
    let layout = hideWidget(defaultLayout(), "overdue");
    layout = moveWidget(layout, "received", -1);
    expect(ids(visibleWidgets(layout)).slice(0, 2)).toEqual(["received", "receivable"]);
    expect(layoutsEqual(moveWidget(layout, "received", -1), layout)).toBe(true);
    const last = visibleWidgets(layout).at(-1)!.id;
    expect(layoutsEqual(moveWidget(layout, last, 1), layout)).toBe(true);
  });

  it("arrasta um widget para a posição de outro", () => {
    const layout = moveWidgetTo(defaultLayout(), "debtorsList", "receivable");
    expect(ids(layout.widgets).slice(0, 2)).toEqual(["debtorsList", "receivable"]);
    expect(moveWidgetTo(layout, "calendar", "calendar")).toBe(layout);
  });

  it("redimensiona largura e altura respeitando as opções", () => {
    let layout = setWidgetWidth(defaultLayout(), "receivable", 12);
    layout = setWidgetHeight(layout, "receivable", "compact");
    expect(layout.widgets[0]).toMatchObject({ width: 12, height: "compact" });
    expect(setWidgetWidth(layout, "receivable", 5 as WidgetWidth)).toBe(layout);
    expect(stepWidgetWidth(layout, "receivable", 1).widgets[0].width).toBe(12);
    expect(stepWidgetWidth(layout, "receivable", -1).widgets[0].width).toBe(8);
    const small = setWidgetWidth(layout, "receivable", 4);
    expect(stepWidgetWidth(small, "receivable", -1).widgets[0].width).toBe(4);
  });

  it("ocupa a largura inteira no celular e as colunas escolhidas no desktop", () => {
    const classes = widgetGridClass({ width: 8, height: "tall" });
    expect(classes).toContain("col-span-12");
    expect(classes).toContain("lg:col-span-8");
    expect(classes).toContain("lg:row-span-2");
  });
});