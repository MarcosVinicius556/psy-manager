"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./header.css";

const navLinks = [
  { href: "#about", label: "Sobre" },
  { href: "#pain-points", label: "Temas" },
  { href: "#process", label: "Como funciona" },
  { href: "#testimonials", label: "Depoimentos" },
  { href: "#courses", label: "Formação" },
  { href: "#questions", label: "Dúvidas" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? "is-solid" : ""}`}>
      <div className="container nav-row">
        <Link href="#hero" className="brand" onClick={() => setOpen(false)}>
          Ellen Machado
          <small>Psicóloga</small>
        </Link>

        <nav className={open ? "is-open" : ""}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="#contact" className="btn-primary nav-cta" onClick={() => setOpen(false)}>
          Agendar conversa
        </Link>

        <button
          className={`burger ${open ? "is-open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
