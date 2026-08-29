"use client";

import { useEffect, useState } from "react";
import processData from "@/data/processData";
import "./process.css";

export default function Process() {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev === processData.length ? 1 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="process" id="process">
      <div className="container">
        <p className="process-kicker">Primeiro encontro</p>
        <h2>Como funciona a primeira sessão?</h2>

        <div className="steps">
          {processData.map((step, i) => (
            <button
              key={step.id}
              type="button"
              className={`step ${active === step.id ? "is-active" : ""}`}
              onClick={() => setActive(step.id)}
              onMouseEnter={() => setActive(step.id)}
            >
              <span className="step-marker">
                <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className="step-line" />
              <span className="step-body">
                <strong>{step.title}</strong>
                <em>{step.description}</em>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
