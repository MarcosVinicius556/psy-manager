import Link from "next/link";

type Props = {
  onAcceptAll: () => void;
  onReject: () => void;
  onConfigure: () => void;
};

export default function CookieBanner({ onAcceptAll, onReject, onConfigure }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1100] border-t border-[#d7e0d8] bg-white/95 p-3 shadow-[0_-8px_30px_rgba(23,47,51,0.12)] backdrop-blur-md sm:p-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-xl lg:rounded-2xl lg:border lg:p-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Consentimento de cookies"
      data-testid="cookie-banner"
    >
      <div className="site-container lg:max-w-none lg:p-0">
        <div className="lg:flex lg:items-center lg:gap-4">
          <p className="text-sm leading-snug text-muted lg:flex-1 lg:text-[0.85rem]">
            Cookies necessários ao login; opcionais só com seu consentimento.{" "}
            <Link href="/cookies" className="font-semibold text-teal underline underline-offset-2">
              Política de Cookies
            </Link>
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:mt-0 lg:shrink-0">
            <button
              type="button"
              className="btn-primary w-full min-h-11 flex-1 sm:w-auto lg:min-h-10 lg:px-4 lg:text-sm"
              onClick={onAcceptAll}
              data-testid="cookie-accept-all"
            >
              Aceitar todos
            </button>
            <button
              type="button"
              className="btn-text w-full min-h-11 flex-1 sm:w-auto lg:min-h-10 lg:px-3 lg:text-sm"
              onClick={onReject}
              data-testid="cookie-reject"
            >
              Rejeitar não necessários
            </button>
            <button
              type="button"
              className="btn-text w-full min-h-11 flex-1 sm:w-auto lg:min-h-10 lg:px-3 lg:text-sm"
              onClick={onConfigure}
            >
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
