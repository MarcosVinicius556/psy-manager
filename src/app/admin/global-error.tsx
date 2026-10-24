"use client";

export default function AdminGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-[#f4f7f2] font-sans text-[#243028] antialiased">
        <div className="grid min-h-dvh place-items-center px-4 py-10">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-[0_18px_50px_rgba(61,82,64,0.1)]">
            <h1 className="text-2xl font-semibold text-[#3d5240]">Painel indisponível no momento</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#5a675c]">
              Ocorreu um erro ao abrir o painel. Atualize a página ou tente novamente em instantes.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#c47a5a] bg-[#c47a5a] px-4 text-sm font-semibold text-white"
              onClick={() => reset()}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
