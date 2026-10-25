"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Caveman404Art } from "./Caveman404Art";
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
        viewBox="0 -125 500 445"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={ILLUSTRATION_LABEL}
      >
        <title>{ILLUSTRATION_LABEL}</title>
        <Caveman404Art onFigureAnimationEnd={onFigureAnimationEnd} />
      </svg>
    </div>
  );
}
