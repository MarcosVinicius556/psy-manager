import Link from "next/link";

type Props = {
  onAcceptAll: () => void;
  onReject: () => void;
  onConfigure: () => void;
};

const actionClass =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

export default function CookieBanner({ onAcceptAll, onReject, onConfigure }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1100] border-t border-[#d7e0d8] bg-white/95 p-4 shadow-[0_-8px_30px_rgba(23,47,51,0.12)] backdrop-blur-md sm:p-5"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Consentimento de cookies"
      data-testid="cookie-banner"
    >
      <div className="site-container">
        <p className="text-sm leading-relaxed text-muted">
          Usamos cookies e armazenamento local necessários ao login e, com seu consentimento, cookies funcionais e analíticos.
          Saiba mais na{" "}
          <Link href="/cookies" className="font-semibold text-teal underline underline-offset-2">
            Política de Cookies
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <button type="button" className={`${actionClass} bg-teal text-white hover:bg-teal-mid`} onClick={onAcceptAll}>
            Aceitar todos
          </button>
          <button
            type="button"
            className={`${actionClass} border border-[#d7e0d8] bg-white text-teal hover:border-teal`}
            onClick={onReject}
          >
            Rejeitar não necessários
          </button>
          <button
            type="button"
            className={`${actionClass} border border-[#d7e0d8] bg-white text-teal hover:border-teal`}
            onClick={onConfigure}
          >
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
}
