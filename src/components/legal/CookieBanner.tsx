import Link from "next/link";

type Props = {
  onAcceptAll: () => void;
  onReject: () => void;
  onConfigure: () => void;
};

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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
          <button
            type="button"
            className="btn-primary w-full min-h-11 flex-1 sm:w-auto"
            onClick={onAcceptAll}
            data-testid="cookie-accept-all"
          >
            Aceitar todos
          </button>
          <button
            type="button"
            className="btn-text w-full min-h-11 flex-1 sm:w-auto"
            onClick={onReject}
            data-testid="cookie-reject"
          >
            Rejeitar não necessários
          </button>
          <button type="button" className="btn-text w-full min-h-11 flex-1 sm:w-auto" onClick={onConfigure}>
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
}
