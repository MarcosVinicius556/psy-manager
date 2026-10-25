import Link from "next/link";

type Props = {
  onAcceptAll: () => void;
  onReject: () => void;
  onConfigure: () => void;
};

export default function CookieBanner({ onAcceptAll, onReject, onConfigure }: Props) {
  return (
    <div
      className="fixed z-[1100] border border-[#d7e0d8] bg-white/95 p-4 shadow-[0_8px_30px_rgba(23,47,51,0.12)] backdrop-blur-md rounded-[var(--radius-surface)] inset-x-3 bottom-3 max-w-[calc(100vw-1.5rem)] sm:inset-x-4 sm:max-w-[calc(100vw-2rem)] desk:inset-x-auto desk:right-4 desk:bottom-4 desk:left-auto desk:w-[min(22rem,calc(100vw-2rem))] min-[64rem]:w-[min(26rem,calc(100vw-2rem))]"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Consentimento de cookies"
      data-testid="cookie-banner"
    >
      <p className="text-sm leading-relaxed text-muted">
        Cookies necessários ao login; opcionais só com seu consentimento.{" "}
        <Link href="/cookies" className="font-semibold text-teal underline underline-offset-2">
          Política de Cookies
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary min-h-11 flex-1 basis-[9.5rem] px-4 py-2.5 text-sm sm:flex-none"
          onClick={onAcceptAll}
          data-testid="cookie-accept-all"
        >
          Aceitar todos
        </button>
        <button
          type="button"
          className="btn-text min-h-11 flex-1 basis-[9.5rem] px-3 py-2.5 text-sm sm:flex-none"
          onClick={onReject}
          data-testid="cookie-reject"
        >
          Rejeitar não necessários
        </button>
        <button
          type="button"
          className="btn-text min-h-11 flex-1 basis-[9.5rem] px-3 py-2.5 text-sm sm:flex-none"
          onClick={onConfigure}
        >
          Configurar
        </button>
      </div>
    </div>
  );
}
