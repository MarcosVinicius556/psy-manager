"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HiChevronLeft, HiChevronRight, HiStar } from "react-icons/hi";
import testimonialsData from "@/data/testimonialsData";
import "./testimonials.css";

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const total = testimonialsData.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 7000);
    return () => clearInterval(timer);
  }, [total]);

  const go = (dir: number) => {
    setIndex((i) => (i + dir + total) % total);
  };

  return (
    <section className="quotes" id="testimonials">
      <div className="container">
        <p className="quotes-kicker">Depoimentos</p>
        <h2>Relatos de quem já passou por aqui</h2>

        <div className="quotes-stage">
          {testimonialsData.map((item, i) => {
            const offset = (i - index + total) % total;
            const isActive = offset === 0;
            return (
              <article
                key={item.id}
                className={`quote-card ${isActive ? "is-active" : ""}`}
                style={{
                  zIndex: total - offset,
                  transform: isActive
                    ? "translate(0, 0) rotate(0deg) scale(1)"
                    : `translate(${offset * 18}px, ${offset * 12}px) rotate(${offset * 1.6}deg) scale(${1 - offset * 0.04})`,
                  opacity: offset > 2 ? 0 : 1 - offset * 0.18,
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                <div className="quote-avatar">
                  <Image src={item.avatar} alt="" width={88} height={88} />
                </div>
                <div className="quote-stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <HiStar key={star} />
                  ))}
                </div>
                <p className="quote-text">“{item.quote}”</p>
                <div className="quote-meta">
                  <strong>{item.author}</strong>
                  <span>paciente desde {item.since}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="quotes-nav">
          <button aria-label="Anterior" onClick={() => go(-1)}>
            <HiChevronLeft size={22} />
          </button>
          <div className="quotes-dots">
            {testimonialsData.map((_, i) => (
              <button
                key={i}
                className={i === index ? "is-on" : ""}
                aria-label={`Depoimento ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button aria-label="Próximo" onClick={() => go(1)}>
            <HiChevronRight size={22} />
          </button>
        </div>

        <p className="quotes-note">
          Utilizado nomes fictícios para preservar a identidade dos pacientes
        </p>
      </div>
    </section>
  );
}
