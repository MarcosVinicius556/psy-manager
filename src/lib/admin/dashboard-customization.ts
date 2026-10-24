import { defaultLayout, type DashboardLayout } from "./dashboard-layout";

/** Layout shown on the admin home: persisted layout only when customization is enabled. */
export function effectiveDashboardLayout(customizationEnabled: boolean, persisted: DashboardLayout | null): DashboardLayout {
  if (!customizationEnabled) return defaultLayout();
  return persisted ?? defaultLayout();
}

export function shouldPersistDashboardLayout(customizationEnabled: boolean): boolean {
  return customizationEnabled;
}
