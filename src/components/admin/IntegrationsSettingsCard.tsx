"use client";

import { Card } from "@/components/admin/ui";
import GoogleCalendarIntegration from "@/components/admin/GoogleCalendarIntegration";
import EmailIntegration from "@/components/admin/EmailIntegration";

export default function IntegrationsSettingsCard() {
  return (
    <Card className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Integrações</p>
      <GoogleCalendarIntegration embedded />
      <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-8">
        <EmailIntegration embedded />
      </div>
    </Card>
  );
}
