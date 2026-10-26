"use client";

import { useEffect, useState } from "react";
import { HiOutlineDeviceMobile } from "react-icons/hi";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function onInstall() {
    if (!deferred) {
      window.alert(
        "Para instalar no iPhone: toque em Compartilhar no Safari e escolha “Adicionar à Tela de Início”. No Android, use o menu do navegador ou aguarde o aviso de instalação."
      );
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <button type="button" className={className || "motion-press flex min-h-11 w-full items-center justify-start gap-3 rounded-md border-0 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-sky-soft/80"} onClick={() => void onInstall()}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sky-soft text-teal">
        <HiOutlineDeviceMobile size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate">Instalar app</span>
    </button>
  );
}
