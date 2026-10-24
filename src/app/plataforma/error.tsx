"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PlataformaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10 text-ink">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow-[0_18px_50px_rgba(61,82,64,0.1)]">
        <h1 className="font-serif text-2xl font-medium text-teal">Não foi possível abrir a plataforma</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Algo impediu esta página de carregar. Tente novamente ou volte aos indicadores.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-primary min-h-11 flex-1" onClick={() => reset()}>
            Tentar novamente
          </button>
          <Link href="/plataforma" className="btn-text min-h-11 flex-1 text-center">
            Ir para indicadores
          </Link>
        </div>
      </div>
    </div>
  );
}
