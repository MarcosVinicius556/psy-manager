"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
        <h1 className="font-serif text-2xl font-medium text-teal">Algo saiu do esperado</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Não foi possível carregar esta parte do painel. Seus dados continuam seguros. Tente de novo ou volte ao início.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-primary min-h-11 flex-1" onClick={() => reset()}>
            Tentar novamente
          </button>
          <Link href="/admin" className="btn-text min-h-11 flex-1 text-center">
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
