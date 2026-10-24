"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/admin/auth-context";
import { SESSION_IDLE_WARNING_MS } from "@/lib/auth/constants";
import {
  loginPathForArea,
  sessionIdlePhase,
  sessionIdleSecondsLeft,
  shouldTrackSessionIdle,
} from "@/lib/auth/session-idle";
import {
  createSessionIdleBroadcaster,
  readStoredActivity,
  writeStoredActivity,
} from "@/lib/auth/session-idle-sync";

const TICK_MS = 1000;

export default function SessionIdleProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || "";
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [secondsLeft, setSecondsLeft] = useState(SESSION_IDLE_WARNING_MS / 1000);
  const [warningOpen, setWarningOpen] = useState(false);
  const lastActivityRef = useRef(lastActivity);

  const tracking = Boolean(user) && shouldTrackSessionIdle(pathname);

  const bumpActivity = useCallback(
    (at: number, broadcast = true) => {
      lastActivityRef.current = at;
      setLastActivity(at);
      setWarningOpen(false);
      writeStoredActivity(at);
      if (broadcast) {
        broadcasterRef.current?.publish({ type: "activity", at });
      }
    },
    [],
  );

  const broadcasterRef = useRef<ReturnType<typeof createSessionIdleBroadcaster> | null>(null);

  useEffect(() => {
    if (!tracking) return;
    const stored = readStoredActivity();
    if (stored) bumpActivity(Math.max(stored, Date.now()), false);
    else bumpActivity(Date.now(), false);

    const broadcaster = createSessionIdleBroadcaster((message) => {
      if (message.type === "logout") {
        void logout().then(() => router.replace(loginPathForArea(pathname)));
        return;
      }
      if (message.type === "activity" || message.type === "extend") {
        bumpActivity(message.at, false);
      }
    });
    broadcasterRef.current = broadcaster;
    return () => broadcaster.close();
  }, [bumpActivity, logout, pathname, router, tracking]);

  useEffect(() => {
    if (!tracking) return;
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    function onActivity() {
      bumpActivity(Date.now());
    }
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [bumpActivity, tracking]);

  useEffect(() => {
    if (!tracking) {
      setWarningOpen(false);
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const phase = sessionIdlePhase(lastActivityRef.current, now);
      if (phase === "active") {
        setWarningOpen(false);
        return;
      }
      if (phase === "warning") {
        setWarningOpen(true);
        setSecondsLeft(sessionIdleSecondsLeft(lastActivityRef.current, now));
        return;
      }
      setWarningOpen(false);
      const at = now;
      broadcasterRef.current?.publish({ type: "logout", at });
      void logout().then(() => router.replace(loginPathForArea(pathname)));
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [logout, pathname, router, tracking]);

  function stayConnected() {
    const at = Date.now();
    bumpActivity(at);
    broadcasterRef.current?.publish({ type: "extend", at });
  }

  return (
    <>
      {children}
      {tracking &&
        warningOpen &&
        createPortal(
          <div className="sheet-host fixed inset-0 z-[100] grid place-items-center bg-ink/50 p-4">
            <div
              className="sheet-panel w-full max-w-md rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.18)] sm:p-6"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="session-idle-title"
              aria-describedby="session-idle-desc"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-teal">Sessão</p>
              <h2 id="session-idle-title" className="mt-2 font-serif text-[clamp(1.5rem,5vw,1.875rem)] leading-tight text-teal">
                Sua sessão vai expirar
              </h2>
              <p id="session-idle-desc" className="mt-3 leading-relaxed text-muted">
                Por segurança, encerramos o acesso após inatividade. Você será desconectado em{" "}
                <span className="font-semibold text-ink">{secondsLeft}s</span> se não continuar.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn-primary min-h-11 w-full sm:w-auto" onClick={stayConnected}>
                  Continuar conectado
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
