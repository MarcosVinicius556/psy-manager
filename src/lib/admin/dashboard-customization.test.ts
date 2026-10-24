import { describe, expect, it } from "vitest";
import { defaultLayout, hideWidget, layoutsEqual, sanitizeLayout } from "./dashboard-layout";
import { effectiveDashboardLayout, shouldPersistDashboardLayout } from "./dashboard-customization";

describe("effectiveDashboardLayout", () => {
  it("ignora layout salvo quando a personalização está desligada", () => {
    const customized = hideWidget(defaultLayout(), "calendar");
    expect(layoutsEqual(effectiveDashboardLayout(false, customized), defaultLayout())).toBe(true);
    expect(layoutsEqual(effectiveDashboardLayout(false, sanitizeLayout({ widgets: [] })), defaultLayout())).toBe(true);
  });

  it("usa o layout persistido quando a personalização está ligada", () => {
    const customized = hideWidget(defaultLayout(), "calendar");
    expect(layoutsEqual(effectiveDashboardLayout(true, customized), customized)).toBe(true);
  });

  it("cai no padrão enquanto o layout ainda não carregou", () => {
    expect(layoutsEqual(effectiveDashboardLayout(true, null), defaultLayout())).toBe(true);
  });
});

describe("shouldPersistDashboardLayout", () => {
  it("só persiste com a flag ligada", () => {
    expect(shouldPersistDashboardLayout(false)).toBe(false);
    expect(shouldPersistDashboardLayout(true)).toBe(true);
  });
});
