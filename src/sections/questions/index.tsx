"use client";

import { useState } from "react";
import faqData from "@/data/faqData";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import "./questions.css";

export default function FrequentlyQuestions() {
  const [open, setOpen] = useState<number | null>(1);

  return (
    <section className="faq" id="questions">
      <div className="container">
        <h2>Dúvidas frequentes</h2>
        <div className="faq-list">
          {faqData.map((item) => (
            <article key={item.id} className={open === item.id ? "is-open" : ""}>
              <button
                type="button"
                onClick={() => setOpen(open === item.id ? null : item.id)}
              >
                {item.question}
                {open === item.id ? <RiSubtractLine size={20} /> : <RiAddLine size={20} />}
              </button>
              {open === item.id && <p>{item.answer}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
