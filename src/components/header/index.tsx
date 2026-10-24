"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const navLinks = [
  { href: "/#produto", label: "Produto" },
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Valores" },
  { href: "/#faq", label: "Perguntas" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/feedback") || pathname.startsWith("/plataforma") || pathname.startsWith("/cadastro")) return null;

  const solid = scrolled || open;
  const barColor = solid ? "bg-ink" : "bg-white";

  return (
    <header
      className={`landing fixed inset-x-0 top-0 z-[1000] pb-3 transition-[background,box-shadow,color] duration-300 ease-in-out ${
        solid ? "header-scrolled shadow-[0_1px_0_rgba(61,82,64,0.1)] backdrop-blur-[16px]" : "header-on-media"
      }`}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[999] bg-teal/30 xl:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="site-container relative z-[1002] flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center" onClick={() => setOpen(false)} aria-label="Psy Manager">
          <BrandLogo
            variant={solid ? "lockup" : "mark"}
            height={solid ? 40 : 36}
            className="max-h-9 w-auto max-w-[58vw] sm:max-h-10"
            priority
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:flex" aria-label="Seções">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="landing-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden items-center gap-3 xl:flex">
            <Link href="/admin/login" className="btn-text">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary">
              Começar gratuitamente
            </Link>
          </span>
          <button
            ref={buttonRef}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-md border-0 bg-transparent xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <span className="flex w-5 flex-col gap-1.5" aria-hidden>
              <span className={`block h-0.5 w-5 rounded-full transition-transform duration-200 ${barColor} ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 rounded-full transition-transform duration-200 ${barColor} ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <nav
        id="site-menu"
        ref={menuRef}
        aria-label="Seções"
        inert={open ? undefined : true}
        className={`fixed inset-y-0 right-0 z-[1001] flex w-[min(20rem,86vw)] flex-col gap-1 overflow-y-auto bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] shadow-[-20px_0_40px_rgba(61,82,64,0.1)] transition-transform duration-300 ease-in-out xl:hidden ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="landing-nav-link flex min-h-11 items-center text-[1.05rem]"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/admin/login" className="landing-nav-link flex min-h-11 items-center text-[1.05rem]" onClick={() => setOpen(false)}>
          Entrar
        </Link>
        <Link href="/cadastro" className="btn-primary mt-4" onClick={() => setOpen(false)}>
          Começar gratuitamente
        </Link>
      </nav>
    </header>
  );
}
