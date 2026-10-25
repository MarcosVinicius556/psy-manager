import type { Metadata } from "next";
import Caveman404Illustration from "@/components/not-found/Caveman404Illustration";
import NotFoundActions from "@/components/not-found/NotFoundActions";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="w-full px-4 pb-10 pt-[clamp(4.75rem,8vh,5.75rem)] sm:pb-12">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <p
          className="font-num text-[clamp(3.25rem,14vw,5.25rem)] font-semibold leading-none tracking-tight text-ink/70"
          aria-hidden="true"
        >
          404
        </p>

        <div className="mt-1 w-full">
          <Caveman404Illustration />
        </div>

        <div className="mt-6 grid w-full gap-1.5">
          <h1 className="text-[clamp(1.65rem,5vw,2.25rem)] font-semibold leading-tight text-ink">
            Parece que você se perdeu
          </h1>
          <p className="text-sm leading-snug text-muted sm:text-[0.95rem]">
            A página que você procura não existe ou foi movida.
          </p>
        </div>

        <div className="mt-5 w-full">
          <NotFoundActions />
        </div>
      </div>
    </div>
  );
}
