"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./caveman-404.css";

const ILLUSTRATION_LABEL =
  "Ilustração de um homem das cavernas segurando um cabo desconectado com um plugue elétrico";

export default function Caveman404Illustration() {
  const [jumping, setJumping] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const jumpLock = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const playful = !reducedMotion;

  const triggerJump = useCallback(() => {
    if (!playful || jumpLock.current) return;
    jumpLock.current = true;
    setJumping(true);
  }, [playful]);

  const onFigureAnimationEnd = useCallback(
    (event: React.AnimationEvent) => {
      if (event.animationName !== "cave-404-yank") return;
      setJumping(false);
      jumpLock.current = false;
    },
    []
  );

  return (
    <div
      className={[
        "cave-404-interactive",
        playful ? "cave-404-interactive--playful" : "",
        jumping ? "cave-404-interactive--jump" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") triggerJump();
      }}
      onClick={triggerJump}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          triggerJump();
        }
      }}
      tabIndex={playful ? 0 : -1}
    >
      <svg
        className="cave-404-svg"
        viewBox="0 0 360 200"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={ILLUSTRATION_LABEL}
      >
        <title>{ILLUSTRATION_LABEL}</title>

        <line x1="24" y1="168" x2="336" y2="168" stroke="var(--color-border-subtle)" strokeWidth="2" />

        <ellipse
          className="cave-404__shadow"
          cx="182"
          cy="172"
          rx="34"
          ry="7"
          fill="var(--color-teal)"
          opacity="0.18"
        />

        <g aria-hidden="true">
          <ellipse cx="58" cy="166" rx="14" ry="4" fill="var(--color-sage-light)" opacity="0.85" />
          <ellipse cx="72" cy="164" rx="10" ry="3.5" fill="var(--color-sage-light)" opacity="0.75" />
          <rect x="62" y="128" width="26" height="10" rx="5" fill="#b8c4ba" />
          <rect x="66" y="116" width="20" height="10" rx="5" fill="#c5cec6" />
          <rect x="70" y="104" width="14" height="10" rx="5" fill="#d2d9d3" />

          <ellipse cx="298" cy="166" rx="12" ry="4" fill="var(--color-sage-light)" opacity="0.85" />
          <path
            d="M286 168 L286 92 Q286 78 302 78 Q318 78 318 92 L318 168 Z"
            fill="#c5cec6"
          />
          <path d="M292 168 L292 100 Q292 88 304 88 Q316 88 316 100 L316 168 Z" fill="#d2d9d3" opacity="0.45" />
        </g>

        <g className="cave-404__figure" onAnimationEnd={onFigureAnimationEnd}>
          <g className="cave-404__leg-left">
            <path d="M168 148 L158 168 L172 168 L176 148 Z" fill="#8b5e3c" />
            <rect x="154" y="166" width="20" height="6" rx="2" fill="#5c4033" />
          </g>
          <g className="cave-404__leg-right">
            <path d="M196 148 L206 168 L192 168 L188 148 Z" fill="#8b5e3c" />
            <rect x="186" y="166" width="20" height="6" rx="2" fill="#5c4033" />
          </g>

          <path
            d="M162 118 Q182 108 202 118 L198 150 Q182 156 166 150 Z"
            fill="var(--color-accent)"
          />
          <circle cx="174" cy="132" r="3" fill="#a85f42" opacity="0.55" />
          <circle cx="188" cy="138" r="2.5" fill="#a85f42" opacity="0.5" />
          <circle cx="180" cy="142" r="2" fill="#a85f42" opacity="0.45" />

          <g className="cave-404__arm-left">
            <path d="M164 122 L148 128 L146 134 L162 130 Z" fill="#e8c4a0" />
          </g>

          <circle cx="182" cy="98" r="22" fill="#e8c4a0" />
          <path
            d="M162 92 Q182 72 202 92 Q198 108 182 110 Q166 108 162 92 Z"
            fill="#5c4033"
          />
          <ellipse cx="182" cy="100" rx="16" ry="12" fill="#5c4033" />
          <circle cx="174" cy="96" r="2.2" fill="#243028" />
          <circle cx="190" cy="96" r="2.2" fill="#243028" />
          <path d="M176 104 Q182 108 188 104" stroke="#8b5e3c" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          <g className="cave-404__lasso-arm">
            <g className="cave-404__arm-right">
              <path d="M200 122 L216 118 L218 124 L202 130 Z" fill="#e8c4a0" />
            </g>
            <path
              d="M214 120 C228 108 248 88 268 72 C278 64 290 58 302 52"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <g transform="translate(298 48)">
              <rect x="0" y="6" width="14" height="10" rx="2" fill="#1a1a1a" />
              <rect x="3" y="0" width="3.5" height="6" rx="1" fill="#1a1a1a" />
              <rect x="7.5" y="0" width="3.5" height="6" rx="1" fill="#1a1a1a" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
