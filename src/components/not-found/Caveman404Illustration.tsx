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
        viewBox="0 0 480 268"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={ILLUSTRATION_LABEL}
      >
        <title>{ILLUSTRATION_LABEL}</title>

        <line x1="32" y1="228" x2="448" y2="228" stroke="var(--color-border-subtle)" strokeWidth="2.5" />

        <ellipse
          className="cave-404__shadow"
          cx="242"
          cy="232"
          rx="46"
          ry="9"
          fill="var(--color-teal)"
          opacity="0.22"
        />

        <g aria-hidden="true">
          <ellipse cx="88" cy="224" rx="18" ry="5" fill="var(--color-sage-light)" opacity="0.9" />
          <ellipse cx="108" cy="222" rx="14" ry="4" fill="var(--color-sage-light)" opacity="0.75" />
          <ellipse cx="98" cy="214" rx="34" ry="11" fill="#b8c4ba" />
          <ellipse cx="98" cy="198" rx="28" ry="10" fill="#c5cec6" />
          <ellipse cx="98" cy="184" rx="22" ry="9" fill="#d5dcd6" />

          <ellipse cx="418" cy="224" rx="16" ry="5" fill="var(--color-sage-light)" opacity="0.9" />
          <ellipse cx="392" cy="222" rx="12" ry="4" fill="var(--color-sage-light)" opacity="0.8" />
          <ellipse cx="368" cy="214" rx="22" ry="18" fill="#c5cec6" />
          <path
            d="M388 228 L388 118 Q388 96 412 96 Q436 96 436 118 L436 228 Z"
            fill="#c5cec6"
          />
          <path
            d="M396 228 L396 128 Q396 110 412 110 Q428 110 428 128 L428 228 Z"
            fill="#d8ded9"
            opacity="0.55"
          />
        </g>

        <g className="cave-404__figure" onAnimationEnd={onFigureAnimationEnd}>
          <g className="cave-404__leg-left">
            <path d="M224 196 L212 228 L232 228 L236 196 Z" fill="#e5c49a" />
            <ellipse cx="222" cy="228" rx="14" ry="5" fill="#d4b48a" />
          </g>
          <g className="cave-404__leg-right">
            <path d="M260 196 L272 228 L252 228 L248 196 Z" fill="#e5c49a" />
            <ellipse cx="262" cy="228" rx="14" ry="5" fill="#d4b48a" />
          </g>

          <path
            d="M218 152 Q242 142 266 152 L262 200 Q242 208 222 200 Z"
            fill="var(--color-accent)"
          />
          <ellipse cx="232" cy="172" rx="4" ry="3.5" fill="#a85f42" opacity="0.65" />
          <ellipse cx="252" cy="178" rx="3.5" ry="3" fill="#a85f42" opacity="0.55" />
          <ellipse cx="244" cy="188" rx="3" ry="2.5" fill="#9a563f" opacity="0.5" />

          <g className="cave-404__arm-left">
            <path d="M218 158 L196 168 L194 176 L216 170 Z" fill="#e5c49a" />
            <circle cx="193" cy="177" r="7" fill="#e5c49a" />
          </g>

          <g className="cave-404__arm-right">
            <path d="M266 158 L284 166 L282 174 L264 168 Z" fill="#e5c49a" />
            <circle cx="268" cy="168" r="7.5" fill="#e5c49a" />
          </g>

          <circle cx="242" cy="128" r="30" fill="#e5c49a" />
          <path
            d="M214 118 Q218 88 242 82 Q268 86 272 112 Q268 124 242 126 Q216 124 214 118 Z"
            fill="#5c4033"
          />
          <path
            d="M220 104 Q228 92 248 94 Q262 98 268 110 Q252 102 236 104 Q224 106 220 104 Z"
            fill="#6b4a35"
          />
          <path
            d="M228 138 Q242 152 256 138 Q252 148 242 150 Q232 148 228 138 Z"
            fill="#5c4033"
          />
          <ellipse cx="242" cy="132" rx="17" ry="14" fill="#e5c49a" />
          <circle cx="232" cy="126" r="3" fill="#243028" />
          <circle cx="252" cy="126" r="3" fill="#243028" />
          <circle cx="242" cy="132" r="2.2" fill="#c9a07a" />
          <path d="M236 140 Q242 143 248 140" stroke="#8b5e3c" strokeWidth="2" fill="none" strokeLinecap="round" />

          <g className="cave-404__lasso">
            <path
              d="M268 168 L268 202"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g transform="translate(258 202)">
              <rect x="0" y="10" width="20" height="14" rx="2" fill="#1a1a1a" />
              <rect x="4" y="0" width="4.5" height="9" rx="1" fill="#1a1a1a" />
              <rect x="11.5" y="0" width="4.5" height="9" rx="1" fill="#1a1a1a" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
