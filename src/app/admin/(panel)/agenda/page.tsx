"use client";

import { Suspense } from "react";
import AgendaPage from "./AgendaPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando agenda...</p>}>
      <AgendaPage />
    </Suspense>
  );
}
