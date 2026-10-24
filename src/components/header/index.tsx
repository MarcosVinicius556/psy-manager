"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/feedback") || pathname.startsWith("/plataforma") || pathname.startsWith("/cadastro")) return null;

  return (
    <header
      className={`landing fixed inset-x-0 top-0 z-[1000] py-[22px] transition-[background,box-shadow,padding,color] duration-300 ease-in-out ${
        scrolled
          ? "header-scrolled py-3.5 shadow-[0_1px_0_rgba(61,82,64,0.1)] backdrop-blur-[16px]"
          : "header-on-media"
      }`}
    >
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[999] bg-teal/20 xl:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="container relative z-[1002] flex items-center justify-between">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)} aria-label="Psy Manager">
          <BrandLogo variant={scrolled || open ? "lockup" : "mark"} height={scrolled || open ? 42 : 40} priority />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:flex">
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
            type="button"
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 border-0 bg-transparent xl:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <span
              className={`block h-0.5 w-5 rounded-full transition-transform duration-200 ${
                scrolled || open ? "bg-ink" : "bg-white"
              } ${open ? "translate-y-[5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full transition-transform duration-200 ${
                scrolled || open ? "bg-ink" : "bg-white"
              } ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      <nav
        className={`fixed inset-y-0 right-0 z-[1001] flex w-[min(300px,78vw)] flex-col gap-[22px] bg-white px-8 pt-[100px] pb-8 shadow-[-20px_0_40px_rgba(61,82,64,0.1)] transition-transform duration-300 ease-in-out xl:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="landing-nav-link text-[1.1rem]"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/admin/login" className="landing-nav-link text-[1.1rem]" onClick={() => setOpen(false)}>
          Entrar
        </Link>
        <Link href="/cadastro" className="btn-primary mt-2" onClick={() => setOpen(false)}>
          Começar gratuitamente
        </Link>
      </nav>
    </header>
  );
}
