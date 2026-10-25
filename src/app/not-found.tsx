import type { Metadata } from "next";
import Caveman404Illustration from "@/components/not-found/Caveman404Illustration";
import NotFoundActions from "@/components/not-found/NotFoundActions";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <p
          className="font-num text-[clamp(4.5rem,18vw,6.5rem)] font-semibold leading-none tracking-tight text-teal/25"
          aria-hidden="true"
        >
          404
        </p>

        <Caveman404Illustration />

        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Parece que você se perdeu</h1>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            A página que você procura não existe ou foi movida.
          </p>
        </div>

        <NotFoundActions />
      </div>
    </div>
  );
}
